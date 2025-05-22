// services/offrampCallbackService.js
const EventEmitter = require('events');
const { Order, ORDER_STATUS, ORDER_TYPE } = require('../models/Order');
const { checkOfframpOrder, getPaycrestOrderStatus } = require('../cronJobs/offrampStatusChecker');

class OfframpCallbackService extends EventEmitter {
  constructor() {
    super();
    this.activePolling = new Map(); // Store active polling sessions
    this.maxPollDuration = 35 * 60 * 1000; // 35 minutes max polling
    this.pollInterval = 10 * 1000; // Poll every 10 seconds
  }

  // Start polling for an order
  async startPolling(orderId, userId) {
    console.log(`[CALLBACK_POLL] Starting polling for order ${orderId}`);
    
    // Check if already polling this order
    if (this.activePolling.has(orderId)) {
      console.log(`[CALLBACK_POLL] Order ${orderId} already being polled`);
      return { success: false, message: 'Order already being polled' };
    }

    try {
      // Verify order exists and belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        type: ORDER_TYPE.OFFRAMP,
        externalOrderId: { $exists: true, $ne: null }
      });

      if (!order) {
        return { success: false, message: 'Order not found or invalid' };
      }

      // Check if order is already in final state
      const finalStates = [ORDER_STATUS.COMPLETED, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED];
      if (finalStates.includes(order.status)) {
        return { 
          success: true, 
          message: 'Order already in final state',
          status: order.status,
          isFinal: true
        };
      }

      // Start polling
      const pollData = {
        orderId,
        userId,
        startTime: Date.now(),
        intervalId: null,
        timeoutId: null
      };

      // Set up polling interval
      pollData.intervalId = setInterval(async () => {
        await this.pollOrderStatus(orderId);
      }, this.pollInterval);

      // Set up timeout to stop polling after max duration
      pollData.timeoutId = setTimeout(() => {
        this.stopPolling(orderId, 'timeout');
      }, this.maxPollDuration);

      this.activePolling.set(orderId, pollData);

      console.log(`[CALLBACK_POLL] Started polling for order ${orderId}, will poll every ${this.pollInterval}ms for max ${this.maxPollDuration}ms`);

      return { 
        success: true, 
        message: 'Polling started',
        pollInterval: this.pollInterval,
        maxDuration: this.maxPollDuration
      };

    } catch (error) {
      console.error(`[CALLBACK_POLL] Error starting polling for order ${orderId}:`, error);
      return { success: false, message: `Error starting polling: ${error.message}` };
    }
  }

  // Stop polling for an order
  stopPolling(orderId, reason = 'manual') {
    console.log(`[CALLBACK_POLL] Stopping polling for order ${orderId}, reason: ${reason}`);
    
    const pollData = this.activePolling.get(orderId);
    if (!pollData) {
      console.log(`[CALLBACK_POLL] No active polling found for order ${orderId}`);
      return false;
    }

    // Clear interval and timeout
    if (pollData.intervalId) {
      clearInterval(pollData.intervalId);
    }
    if (pollData.timeoutId) {
      clearTimeout(pollData.timeoutId);
    }

    // Remove from active polling
    this.activePolling.delete(orderId);

    // Emit stop event
    this.emit('pollingStopped', {
      orderId,
      reason,
      duration: Date.now() - pollData.startTime
    });

    console.log(`[CALLBACK_POLL] Stopped polling for order ${orderId}`);
    return true;
  }

  // Poll order status
  async pollOrderStatus(orderId) {
    try {
      console.log(`[CALLBACK_POLL] Polling status for order ${orderId}`);
      
      const pollData = this.activePolling.get(orderId);
      if (!pollData) {
        console.log(`[CALLBACK_POLL] Order ${orderId} no longer in active polling`);
        return;
      }

      // Get current order from database
      const order = await Order.findById(orderId);
      if (!order) {
        console.log(`[CALLBACK_POLL] Order ${orderId} not found, stopping polling`);
        this.stopPolling(orderId, 'order_not_found');
        return;
      }

      // Check order status using the existing checker
      const result = await checkOfframpOrder(order);
      
      if (result.success) {
        // Get updated order status
        const updatedOrder = await Order.findById(orderId);
        
        // Emit status update event
        this.emit('statusUpdate', {
          orderId,
          userId: pollData.userId,
          previousStatus: order.status,
          currentStatus: updatedOrder.status,
          action: result.action,
          timestamp: new Date()
        });

        // Check if order reached final state
        const finalStates = [ORDER_STATUS.COMPLETED, ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED];
        if (finalStates.includes(updatedOrder.status)) {
          console.log(`[CALLBACK_POLL] Order ${orderId} reached final state: ${updatedOrder.status}`);
          
          // Emit final status event
          this.emit('finalStatus', {
            orderId,
            userId: pollData.userId,
            finalStatus: updatedOrder.status,
            order: updatedOrder,
            duration: Date.now() - pollData.startTime
          });

          // Stop polling
          this.stopPolling(orderId, 'final_status_reached');
        }
      } else {
        console.error(`[CALLBACK_POLL] Error checking order ${orderId}:`, result.error);
        
        // Emit error event but continue polling
        this.emit('pollingError', {
          orderId,
          userId: pollData.userId,
          error: result.error,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error(`[CALLBACK_POLL] Error in pollOrderStatus for ${orderId}:`, error);
      
      // Emit error event
      this.emit('pollingError', {
        orderId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  // Get polling status for an order
  getPollingStatus(orderId) {
    const pollData = this.activePolling.get(orderId);
    if (!pollData) {
      return { isPolling: false };
    }

    return {
      isPolling: true,
      startTime: pollData.startTime,
      duration: Date.now() - pollData.startTime,
      remainingTime: this.maxPollDuration - (Date.now() - pollData.startTime)
    };
  }

  // Get all active polling sessions
  getActivePolling() {
    const active = [];
    for (const [orderId, pollData] of this.activePolling) {
      active.push({
        orderId,
        userId: pollData.userId,
        startTime: pollData.startTime,
        duration: Date.now() - pollData.startTime
      });
    }
    return active;
  }

  // Manual status check (immediate, not polling)
  async checkOrderStatusNow(orderId, userId) {
    try {
      console.log(`[CALLBACK_MANUAL] Manual status check for order ${orderId}`);
      
      // Verify order exists and belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        type: ORDER_TYPE.OFFRAMP,
        externalOrderId: { $exists: true, $ne: null }
      });

      if (!order) {
        return { success: false, message: 'Order not found or invalid' };
      }

      // Check status using the existing checker
      const result = await checkOfframpOrder(order);
      
      if (result.success) {
        // Get updated order
        const updatedOrder = await Order.findById(orderId);
        
        return {
          success: true,
          order: {
            id: updatedOrder._id,
            status: updatedOrder.status,
            type: updatedOrder.type,
            sourceAmount: updatedOrder.sourceAmount,
            sourceCurrency: updatedOrder.sourceCurrency,
            targetAmount: updatedOrder.targetAmount,
            targetCurrency: updatedOrder.targetCurrency,
            depositAddress: updatedOrder.depositAddress,
            bankDetails: updatedOrder.bankDetails,
            createdAt: updatedOrder.createdAt,
            updatedAt: updatedOrder.updatedAt,
            completedAt: updatedOrder.completedAt,
            transactionHash: updatedOrder.txHash,
            externalOrderId: updatedOrder.externalOrderId
          },
          result: result
        };
      } else {
        return { 
          success: false, 
          message: `Status check failed: ${result.error}`,
          order: {
            id: order._id,
            status: order.status,
            lastChecked: new Date()
          }
        };
      }

    } catch (error) {
      console.error(`[CALLBACK_MANUAL] Error in manual status check for order ${orderId}:`, error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
}

// Create singleton instance
const offrampCallbackService = new OfframpCallbackService();

module.exports = offrampCallbackService;

// ==========================================
// Controller methods to add to rampController.js
// ==========================================

// Add these methods to your rampController object:

const offrampCallbackMethods = {
  // Start polling for order status
  startOfframpPolling: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      
      console.log(`[POLLING_START] User ${userId} starting polling for order ${orderId}`);
      
      const result = await offrampCallbackService.startPolling(orderId, userId);
      
      if (result.success) {
        return res.json({
          success: true,
          message: result.message,
          polling: {
            orderId,
            isPolling: true,
            pollInterval: result.pollInterval,
            maxDuration: result.maxDuration,
            isFinal: result.isFinal || false
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('[POLLING_START] Error starting polling:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start polling'
      });
    }
  },

  // Stop polling for order status
  stopOfframpPolling: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      
      console.log(`[POLLING_STOP] User ${userId} stopping polling for order ${orderId}`);
      
      // Verify order belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        type: ORDER_TYPE.OFFRAMP
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const stopped = offrampCallbackService.stopPolling(orderId, 'user_request');
      
      return res.json({
        success: true,
        message: stopped ? 'Polling stopped' : 'No active polling found',
        polling: {
          orderId,
          isPolling: false
        }
      });

    } catch (error) {
      console.error('[POLLING_STOP] Error stopping polling:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to stop polling'
      });
    }
  },

  // Get polling status for an order
  getOfframpPollingStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      
      // Verify order belongs to user
      const order = await Order.findOne({
        _id: orderId,
        userId: userId,
        type: ORDER_TYPE.OFFRAMP
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const pollingStatus = offrampCallbackService.getPollingStatus(orderId);
      
      return res.json({
        success: true,
        polling: {
          orderId,
          ...pollingStatus
        }
      });

    } catch (error) {
      console.error('[POLLING_STATUS] Error getting polling status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get polling status'
      });
    }
  },

  // Manual immediate status check
  checkOfframpStatusNow: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user._id;
      
      console.log(`[STATUS_CHECK_NOW] User ${userId} checking status for order ${orderId}`);
      
      const result = await offrampCallbackService.checkOrderStatusNow(orderId, userId);
      
      if (result.success) {
        return res.json({
          success: true,
          message: 'Status checked successfully',
          order: result.order,
          checkResult: result.result
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
          order: result.order
        });
      }

    } catch (error) {
      console.error('[STATUS_CHECK_NOW] Error checking status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check order status'
      });
    }
  }
};

module.exports = { offrampCallbackService, offrampCallbackMethods };