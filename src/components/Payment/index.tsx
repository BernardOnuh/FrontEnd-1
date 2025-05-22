import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { usePrivy } from "@privy-io/react-auth";
import axios from 'axios';

// API URL from environment variables with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aboki-api.onrender.com/api';

// Enhanced logging utility
const logWithDetails = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  
  // Format data for better readability in console
  let formattedData = '';
  if (data) {
    if (typeof data === 'object') {
      try {
        formattedData = JSON.stringify(data, null, 2);
      } catch (e) {
        formattedData = String(data);
      }
    } else {
      formattedData = String(data);
    }
  }
  
  // Add visual separation based on category
  let style = '';
  switch (category.toUpperCase()) {
    case 'ERROR':
      style = 'color: red; font-weight: bold;';
      break;
    case 'API':
      style = 'color: blue; font-weight: bold;';
      break;
    case 'AUTH':
      style = 'color: purple; font-weight: bold;';
      break;
    case 'WARNING':
      style = 'color: orange; font-weight: bold;';
      break;
    default:
      style = 'color: black;';
  }
  
  // Log with styled category and timestamp
  console.log(`%c[${category}]%c [${timestamp}] ${message}`, style, 'color: gray;');
  
  // Log additional data if provided
  if (formattedData) {
    console.log(data);
  }
  
  // For errors, add a stack trace
  if (category.toUpperCase() === 'ERROR' && data instanceof Error) {
    console.error('Stack trace:', data.stack);
  }
};

// Setup Axios interceptors for better debugging
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      logWithDetails('API REQUEST', `${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
        params: config.params
      });
      return config;
    },
    (error) => {
      logWithDetails('API REQUEST ERROR', 'Request failed', error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      logWithDetails('API RESPONSE', `${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
      return response;
    },
    (error) => {
      logWithDetails('API RESPONSE ERROR', 'Response error', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });
      return Promise.reject(error);
    }
  );
};

// Type definitions
interface Order {
  _id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  recipientWalletAddress?: string;
  transactionHash?: string;
  completedAt?: string;
  notes?: string;
}

interface CallbackResult {
  success: boolean;
  message: string;
}

// Support contact information
const SUPPORT_CONTACTS = {
  telegram: "@AbokiSupport",
  whatsapp: "+2348012345678" // Replace with actual WhatsApp number
};

const PaymentSuccessPage = () => {
  // Get URL parameters using React Router
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentReference = searchParams.get('paymentReference');
  const navigate = useNavigate();
  
  // Get Privy authentication context
  const { user, authenticated } = usePrivy();
  
  // State management
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackResult, setCallbackResult] = useState<CallbackResult | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [shouldRefreshOrder, setShouldRefreshOrder] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Add retry counter
  const MAX_RETRIES = 3; // Maximum number of automatic retries

  // Initialize Axios interceptors
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  // Function to create a new authentication token
  const createAuthToken = useCallback(async (walletAddress: string) => {
    try {
      logWithDetails('AUTH', `Creating auth token for wallet: ${walletAddress}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/ramp/auth/direct-auth`,
        { walletAddress }
      );
      
      if (response.data.success && response.data.data && response.data.data.token) {
        const newToken = response.data.data.token;
        
        // Store token in localStorage
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('walletAddress', walletAddress);
        
        // Update state
        setAuthToken(newToken);
        
        logWithDetails('AUTH', 'Successfully created and stored new auth token');
        return newToken;
      } else {
        throw new Error(response.data.message || 'Failed to create authentication token');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Authentication failed';
      logWithDetails('ERROR', `Auth token creation failed: ${errorMsg}`, err);
      throw err;
    }
  }, []);

  // Initialize authentication token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First try to get token from localStorage
        const token = localStorage.getItem('authToken');
        
        if (token) {
          setAuthToken(token);
          logWithDetails('AUTH', 'Using existing auth token from localStorage');
          return;
        }
        
        // If no token and user is authenticated with Privy, create a new token
        if (authenticated && user?.wallet?.address) {
          logWithDetails('AUTH', 'No token found in localStorage, creating new token');
          await createAuthToken(user.wallet.address);
        } else {
          logWithDetails('WARNING', 'No auth token available and user not authenticated with Privy');
        }
      } catch (error) {
        logWithDetails('ERROR', 'Auth initialization error', error);
        // Continue without auth if this fails - we'll handle it in the API calls
      }
    };
    
    initializeAuth();
  }, [authenticated, user, createAuthToken]);
  
  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !paymentReference) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      logWithDetails('API', `Fetching order details for orderId: ${orderId}`);
      
      // Get auth token from state or localStorage as fallback
      const token = authToken || localStorage.getItem('authToken');
      
      const response = await axios.get(`${API_BASE_URL}/ramp/orders/${orderId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.data && response.data.success && response.data.order) {
        setOrder(response.data.order);
        logWithDetails('API', `Successfully fetched order: ${response.data.order.status}`);
        
        // Store order and payment reference for testing
        localStorage.setItem('testOrderId', response.data.order._id);
        localStorage.setItem('testPaymentReference', paymentReference);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch order details');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMsg);
      logWithDetails('ERROR', `Order fetch error: ${errorMsg}`, err);
    } finally {
      setLoading(false);
      // Reset the refresh flag after fetching
      setShouldRefreshOrder(false);
    }
  }, [orderId, paymentReference, authToken]);

  // Fetch order on component mount, when auth token changes, or when shouldRefreshOrder is true
  useEffect(() => {
    if (loading || shouldRefreshOrder) {
      fetchOrderDetails();
    }
  }, [fetchOrderDetails, loading, shouldRefreshOrder]);

  // Test the API endpoint with different data structures
  const testPaymentCallbackEndpoint = useCallback(async (testIndex: number) => {
    if (!order || !paymentReference) return null;
    
    try {
      logWithDetails('TEST', `Testing payment callback endpoint with test #${testIndex}`);
      
      // Get token from state or localStorage
      const token = authToken || localStorage.getItem('authToken');
      
      // Define test data variations
      const testVariations = [
        // Test 0: Basic data
        {
          paymentReference,
          paymentStatus: 'PAID',
          paidAmount: order.sourceAmount
        },
        // Test 1: Add orderId
        {
          paymentReference,
          paymentStatus: 'PAID',
          paidAmount: order.sourceAmount,
          orderId: order._id
        },
        // Test 2: Add currencies
        {
          paymentReference,
          paymentStatus: 'PAID',
          paidAmount: order.sourceAmount,
          orderId: order._id,
          sourceCurrency: order.sourceCurrency,
          targetCurrency: order.targetCurrency
        },
        // Test 3: Add type
        {
          paymentReference,
          paymentStatus: 'PAID',
          paidAmount: order.sourceAmount,
          orderId: order._id,
          sourceCurrency: order.sourceCurrency,
          targetCurrency: order.targetCurrency,
          type: order.type
        }
      ];
      
      const testData = testVariations[testIndex % testVariations.length];
      
      logWithDetails('TEST', `Sending test data for variation #${testIndex}:`, testData);
      
      const response = await axios.post(
        `${API_BASE_URL}/ramp/payment/callback`, 
        testData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      logWithDetails('TEST', `Test #${testIndex} result:`, response.data);
      return { success: true, data: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Test failed';
      logWithDetails('TEST', `Test #${testIndex} failed: ${errorMsg}`, err.response?.data);
      return { success: false, error: errorMsg, details: err.response?.data };
    }
  }, [order, paymentReference, authToken]);

  // Handle payment verification with fallback strategy
  const verifyPayment = useCallback(async (isManual: boolean = false) => {
    if (!order || !paymentReference) return;
    
    try {
      setCallbackLoading(true);
      logWithDetails('API', `${isManual ? 'Manually' : 'Auto'}-triggering payment callback for reference: ${paymentReference}`);
      
      // Get token from state or localStorage
      const token = authToken || localStorage.getItem('authToken');
      
      // Try with the most complete data structure first
      const callbackData = {
        paymentReference,
        paymentStatus: 'PAID',
        paidAmount: order.sourceAmount,
        orderId: order._id,
        sourceCurrency: order.sourceCurrency,
        targetCurrency: order.targetCurrency,
        type: order.type
      };
      
      logWithDetails('API', `Sending payment callback data:`, callbackData);
      
      const response = await axios.post(
        `${API_BASE_URL}/ramp/payment/callback`, 
        callbackData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.success) {
        setCallbackResult({ 
          success: true, 
          message: response.data.message || 'Payment verification completed'
        });
        
        // Reset retry count on success
        setRetryCount(0);
        
        // Trigger a refresh by setting the flag
        setShouldRefreshOrder(true);
      } else {
        throw new Error(response.data?.message || 'Payment verification failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to verify payment';
      setCallbackResult({ success: false, message: errorMsg });
      
      // Log detailed error information
      logWithDetails('ERROR', `Payment verification error: ${errorMsg}`, {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // If this was an automatic retry and we haven't exceeded max retries,
      // try the next test variation
      if (!isManual && retryCount < MAX_RETRIES) {
        const nextRetryCount = retryCount + 1;
        setRetryCount(nextRetryCount);
        
        logWithDetails('RETRY', `Will attempt retry #${nextRetryCount} in 3 seconds`);
        
        // Wait before retrying with a different format
        setTimeout(async () => {
          // Use the test function to try a different data structure
          const testResult = await testPaymentCallbackEndpoint(nextRetryCount);
          
          if (testResult && testResult.success) {
            setCallbackResult({ 
              success: true, 
              message: 'Payment verification completed after retry'
            });
            setShouldRefreshOrder(true);
          }
        }, 3000);
      }
    } finally {
      setCallbackLoading(false);
    }
  }, [order, paymentReference, authToken, retryCount, testPaymentCallbackEndpoint]);

  // Auto-trigger payment callback for pending orders - only runs once
  useEffect(() => {
    const triggerPaymentCallback = async () => {
      // Only proceed if we haven't attempted verification, have a pending order, and other conditions
      if (!order || 
          !paymentReference || 
          order.status !== 'pending' || 
          callbackLoading || 
          callbackResult || 
          verificationAttempted) {
        return;
      }
      
      // Mark that we've attempted verification
      setVerificationAttempted(true);
      
      // Invoke the verification function
      await verifyPayment(false);
    };
    
    triggerPaymentCallback();
  }, [order, paymentReference, callbackLoading, callbackResult, verificationAttempted, verifyPayment]);

  // Handler for manual payment verification
  const handleVerifyPayment = () => {
    verifyPayment(true);
  };

  // Countdown for redirect
  useEffect(() => {
    if (countdown > 0 && order?.status === 'completed') {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && order?.status === 'completed') {
      navigate('/activity');
    }
  }, [countdown, order, navigate]);

  // Format currency amount
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    } else if (currency === 'USDC') {
      return `${amount.toFixed(6)} USDC`;
    } else if (currency === 'ETH') {
      return `${amount.toFixed(6)} ETH`;
    }
    return amount.toString();
  };

  // Manual refresh handler
  const handleRefresh = () => {
    setShouldRefreshOrder(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-purple-100">
          <div className="flex flex-col items-center">
            {/* Currency Exchange Animation */}
            <div className="relative w-24 h-24 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-full h-full text-purple-600" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3e8ff" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="#a855f7" 
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset="200"
                  />
                </svg>
              </motion.div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-purple-600 text-xl font-bold">₦/$</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-purple-700 mb-4">
              Verifying Your Payment
            </h1>
            
            <div className="flex items-center justify-center gap-4 mb-6 bg-purple-50 px-6 py-3 rounded-xl border border-purple-100">
              <div className="text-center">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-semibold text-gray-700 truncate max-w-[240px]">
                  {orderId || 'Loading...'}
                </p>
              </div>
            </div>
            
            <div className="w-full max-w-xs bg-purple-100 h-2 rounded-full overflow-hidden mb-6">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-purple-400 via-purple-600 to-purple-400 w-1/2 rounded-full"
              />
            </div>
            
            <p className="text-center text-gray-600">
              Please wait while we confirm your transaction...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-red-600 mb-4">
              Payment Error
            </h1>
            
            <p className="text-center mb-6 text-gray-700">{error}</p>
            
            {/* Support contact information */}
            <div className="mb-6 w-full bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="text-yellow-800 font-medium mb-2">Need help?</h3>
              <p className="text-gray-700 text-sm mb-3">
                Contact our support team for assistance:
              </p>
              <div className="flex flex-col space-y-2">
                <a 
                  href={`https://t.me/${SUPPORT_CONTACTS.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.952 8.265l-1.444 6.808c-.108.496-.401.61-.813.38l-2.246-1.654-1.083 1.042c-.12.12-.22.22-.451.22l.161-2.281 4.154-3.753c.18-.162-.039-.252-.279-.09l-5.133 3.229-2.213-.692c-.48-.151-.49-.48.111-.71l8.64-3.339c.399-.147.75.09.606.85z"/>
                  </svg>
                  Telegram: {SUPPORT_CONTACTS.telegram}
                </a>
                <a 
                  href={`https://wa.me/${SUPPORT_CONTACTS.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  WhatsApp: {SUPPORT_CONTACTS.whatsapp}
                </a>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl shadow-md hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
              
              <Link to="/activity" className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-yellow-100">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-yellow-600 mb-4">
              Order Not Found
            </h1>
            
            <p className="text-center mb-6 text-gray-700">
              We couldn't find the order details. Please check your dashboard for the latest status.
            </p>
            
            {/* Support contact information */}
            <div className="mb-6 w-full bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="text-yellow-800 font-medium mb-2">Need help?</h3>
              <p className="text-gray-700 text-sm mb-3">
                Contact our support team for assistance:
              </p>
              <div className="flex flex-col space-y-2">
                <a 
                  href={`https://t.me/${SUPPORT_CONTACTS.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.952 8.265l-1.444 6.808c-.108.496-.401.61-.813.38l-2.246-1.654-1.083 1.042c-.12.12-.22.22-.451.22l.161-2.281 4.154-3.753c.18-.162-.039-.252-.279-.09l-5.133 3.229-2.213-.692c-.48-.151-.49-.48.111-.71l8.64-3.339c.399-.147.75.09.606.85z"/>
                  </svg>
                  Telegram: {SUPPORT_CONTACTS.telegram}
                </a>
                <a 
                  href={`https://wa.me/${SUPPORT_CONTACTS.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 hover:text-green-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  WhatsApp: {SUPPORT_CONTACTS.whatsapp}
                </a>
              </div>
            </div>
            
            <Link to="/activity" className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl shadow-md hover:bg-purple-700 transition-colors flex items-center justify-center">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main success state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Status Banner */}
        <div className={`w-full h-3 ${
          order.status === 'completed' ? 'bg-gradient-to-r from-purple-400 to-purple-600' : 
          order.status === 'processing' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
          order.status === 'failed' ? 'bg-gradient-to-r from-red-400 to-red-600' :
          'bg-gradient-to-r from-yellow-400 to-yellow-600'
        }`} />
        
        <div className="p-8">
          {/* Status Icon */}
          {order.status === 'completed' && (
            <div className="mb-6 flex justify-center">
              <motion.div 
                variants={{
                  pulse: {
                    scale: [1, 1.1, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  },
                }}
                animate="pulse"
                className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </div>
          )}
          
          {order.status === 'processing' && (
            <div className="mb-6 flex justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.div>
            </div>
          )}
          
          {order.status === 'failed' && (
            <div className="mb-6 flex justify-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.div>
            </div>
          )}
          
          {['pending', 'cancelled'].includes(order.status) && (
            <div className="mb-6 flex justify-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-12 h-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </motion.div>
            </div>
          )}
          
          {/* Status Title */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${
              order.status === 'completed' ? 'text-purple-700' : 
              order.status === 'processing' ? 'text-blue-700' : 
              order.status === 'failed' ? 'text-red-700' :
              'text-yellow-700'
            }`}>
              {order.status === 'completed' ? 'Payment Successful!' : 
               order.status === 'processing' ? 'Payment Processing' : 
               order.status === 'pending' ? 'Payment Pending' :
               order.status === 'cancelled' ? 'Payment Cancelled' :
               'Payment Failed'}
            </h1>
            <p className="text-gray-600 text-lg">
              {order.status === 'completed' ? 'Your transaction has been completed successfully.' : 
               order.status === 'processing' ? 'Your payment is being processed.' : 
               order.status === 'pending' ? 'Your payment is awaiting confirmation.' :
               order.status === 'cancelled' ? 'Your payment was cancelled.' :
               'There was an issue with your payment.'}
            </p>
          </div>
          
          {/* Transaction Details Card */}
          <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-100">
            <h2 className="text-lg font-semibold text-purple-800 mb-4 pb-2 border-b border-purple-200">
              Transaction Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium text-gray-900">{order._id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Reference</span>
                <span className="font-medium text-gray-900">
                  {paymentReference || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium capitalize ${
                  order.status === 'completed' ? 'text-purple-600' :
                  order.status === 'processing' ? 'text-blue-600' :
                  order.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.sourceAmount, order.sourceCurrency)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Received</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.targetAmount, order.targetCurrency)}
                </span>
              </div>
              
              {order.transactionHash && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Hash</span>
                  <a 
                    href={`https://base.etherscan.io/tx/${order.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 hover:underline font-medium truncate max-w-[180px]"
                  >
                    {order.transactionHash.substring(0, 10)}...
                  </a>
                </div>
              )}
              
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed At</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Status-specific Message */}
          {order.status === 'completed' && (
            <div className="text-center mb-6">
              <div className="mb-2 text-xl font-semibold text-purple-700">
                🎉 {formatCurrency(order.targetAmount, order.targetCurrency)} has been sent to your wallet!
              </div>
              
              <div className="text-gray-600">
                Redirecting to dashboard in {countdown} seconds...
              </div>
            </div>
          )}
          
          {order.status === 'processing' && (
            <div className="text-center mb-6">
              <p className="text-blue-700 mb-2">
                Your payment has been received and is being processed.
              </p>
              <p className="text-gray-600 text-sm">
                This usually takes a few minutes. You'll receive a notification once completed.
              </p>
              <button
                onClick={handleRefresh}
                disabled={shouldRefreshOrder}
                className={`mt-4 px-4 py-2 ${shouldRefreshOrder ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded-lg shadow-md transition-colors`}
              >
                {shouldRefreshOrder ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Refreshing...
                  </div>
                ) : "Refresh Status"}
              </button>
            </div>
          )}
          
          {order.status === 'pending' && (
            <div className="text-center mb-6">
              <p className="text-yellow-700 mb-2">
                Your payment is still pending confirmation.
              </p>
              <p className="text-gray-600 text-sm mt-2 mb-4">
                Please wait while we confirm your payment with our provider.
              </p>
              
              {/* Show callback result if available */}
              {callbackResult && (
                <div className={`my-3 p-3 rounded text-sm ${callbackResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {callbackResult.message}
                </div>
              )}
              
              {retryCount > 0 && retryCount < MAX_RETRIES && !callbackResult?.success && (
                <div className="bg-blue-50 text-blue-600 p-2 rounded my-2 text-sm">
                  Automatic verification retry {retryCount}/{MAX_RETRIES} in progress...
                </div>
              )}
              
              <div className="mt-4 flex justify-center space-x-3">
                <button 
                  onClick={handleRefresh}
                  disabled={shouldRefreshOrder}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    shouldRefreshOrder
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  >
                    {shouldRefreshOrder ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Refreshing...
                      </div>
                    ) : "Refresh Status"}
                  </button>
                                  
                  <button 
                    onClick={handleVerifyPayment}
                    disabled={callbackLoading || verificationAttempted}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      callbackLoading || verificationAttempted
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {callbackLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : verificationAttempted ? "Verification in Progress" : "I've Completed Payment"}
                  </button>
                                </div>
                  
                                {/* Debug mode toggle (only in development) */}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="mt-6 text-xs border-t border-gray-200 pt-4">
                                    <button 
                                      onClick={() => {
                                        // Log useful debugging information
                                        logWithDetails('DEBUG', 'Order details', order);
                                        logWithDetails('DEBUG', 'Payment reference', paymentReference);
                                        logWithDetails('DEBUG', 'Auth token', authToken?.substring(0, 10) + '...');
                                        
                                        // Test different callback formats
                                        testPaymentCallbackEndpoint(0).then(result => {
                                          logWithDetails('DEBUG', 'Test format 0 result', result);
                                        });
                                      }}
                                      className="text-gray-500 underline"
                                    >
                                      Run Diagnostic Tests
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {order.status === 'failed' && (
                              <div className="text-center mb-6">
                                <p className="text-red-600 mb-2">
                                  There was an issue with your payment.
                                </p>
                                <p className="text-gray-600 text-sm mb-4">
                                  Reason: {order.notes || "Unknown error occurred"}
                                </p>
                                
                                {/* Support contact information for failed payments */}
                                <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                  <h3 className="text-yellow-800 font-medium mb-2">Need help?</h3>
                                  <p className="text-gray-700 text-sm mb-3">
                                    Contact our support team for assistance with your failed payment:
                                  </p>
                                  <div className="flex flex-col space-y-2">
                                    <a 
                                      href={`https://t.me/${SUPPORT_CONTACTS.telegram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-blue-600 hover:text-blue-800"
                                    >
                                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.952 8.265l-1.444 6.808c-.108.496-.401.61-.813.38l-2.246-1.654-1.083 1.042c-.12.12-.22.22-.451.22l.161-2.281 4.154-3.753c.18-.162-.039-.252-.279-.09l-5.133 3.229-2.213-.692c-.48-.151-.49-.48.111-.71l8.64-3.339c.399-.147.75.09.606.85z"/>
                                      </svg>
                                      Telegram: {SUPPORT_CONTACTS.telegram}
                                    </a>
                                    <a 
                                      href={`https://wa.me/${SUPPORT_CONTACTS.whatsapp}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-green-600 hover:text-green-800"
                                    >
                                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                      </svg>
                                      WhatsApp: {SUPPORT_CONTACTS.whatsapp}
                                    </a>
                                  </div>
                                  <p className="text-gray-600 text-xs mt-2">
                                    Please mention your Order ID: <span className="font-medium">{order._id}</span> when contacting support
                                  </p>
                                </div>
                                
                                <Link to="/app" className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg shadow-md hover:bg-green-600 transition-colors inline-block">
                                  Try Again
                                </Link>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex justify-center space-x-4">
                              <Link to="/activity" className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl shadow-md hover:bg-purple-700 transition-colors flex items-center justify-center">
                                Go to Dashboard
                              </Link>
                              
                              {['completed', 'processing'].includes(order.status) && (
                                <Link to="/transactions" className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center">
                                  View Transactions
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bottom decoration */}
                        <div className="mt-12 text-center text-gray-500 text-sm">
                          Secure payments powered by Aboki
                        </div>
                      </div>
                    );
                  };
                  
                  export default PaymentSuccessPage;