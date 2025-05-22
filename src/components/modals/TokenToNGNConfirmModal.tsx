import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ArrowRight, Info, Wallet, CheckCircle, AlertCircle, 
  Loader, Edit2, RefreshCw, DollarSign, AlertTriangle 
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { useTokenSwap } from "../../contracts/hooks/useTokenSwap";
import { fetchOfframpDepositAddress } from "../../services/contractService";
import { estimateSwapOutput } from "../../services/swapEstimationService";
import { tokens } from "../../constants/swapConstants";
import { config } from '../../wagmiConfig';

// Types
interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  bankCountry: string;
  accountType: string;
  swiftCode: string;
  bankAddress: string;
}

interface SwapDetails {
  fromToken: string;
  fromAmount: number;
  toToken: string;
  toAmount: number;
  rate: number;
}

// Explicitly define the possible swap steps as a union type
type SwapStep = "estimating" | "approval" | "swap" | "complete";
type TransactionStatus = "idle" | "pending" | "success" | "error";

interface TokenToNGNConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
  onConfirm?: (estimatedUSDCAmount?: string | null) => void;
  swapDetails: SwapDetails | null;
  bankDetails: BankDetails | null;
  approvalTxHash?: string | null;
  swapTxHash?: string | null;
  isApproving?: boolean;
  isSwapping?: boolean;
  error?: string | null;
  authToken?: string | null;
  showBankVerification?: boolean;
  onBankVerified?: (details: BankDetails) => void;
}

const TokenToNGNConfirmModal: React.FC<TokenToNGNConfirmModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onConfirm,
  onBankVerified,
  swapDetails,
  bankDetails,
  approvalTxHash,
  swapTxHash,
  isApproving,
  isSwapping,
  error: externalError,
  authToken
}) => {
  // State variables
  const [error, setError] = useState<string | null>(null);
  const [loadingDepositAddress, setLoadingDepositAddress] = useState(false);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountNumberInput, setAccountNumberInput] = useState(bankDetails?.accountNumber || '');
  const [estimatedUSDC, setEstimatedUSDC] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [minReceiveUSDC, setMinReceiveUSDC] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApprovalComplete, setIsApprovalComplete] = useState(false);
  
  // Use the properly typed SwapStep type to ensure type safety
  const [swapStep, setSwapStep] = useState<SwapStep>("estimating");
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>("idle");
  
  // Get user authentication context
  const { user, authenticated } = usePrivy();
  const { address: walletAddress } = useAccount();
  
  // Get token swap functionality
  const { 
    approveTokenSpending,
    createTokenOrder,
    createOrderWithSwapAndConversion,
    createOrderWithPath,
    isLoading,
    isWaitingForTx,
    isTxSuccess,
    error: swapError,
    txHash
  } = useTokenSwap();
  
  // Logger utility
  const logger = {
    log: (category: string, message: string, data?: any) => {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${category}] ${message}`;
      
      if (data) {
        console.groupCollapsed(formattedMessage);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(formattedMessage);
      }
    }
  };
  
  // Get token info from the tokens array
  const getTokenInfo = (symbol: string) => {
    const token = tokens.find(t => t.symbol === symbol);
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }
    
    return {
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol
    };
  };
  
  // Calculate minimum amount with slippage
  const calculateMinAmount = (amount: string, slippagePercent: number = 0.5): string => {
    if (!amount || amount === '0') return '0';
    
    const parsedAmount = parseFloat(amount);
    const slippage = slippagePercent / 100;
    const minAmount = parsedAmount * (1 - slippage);
    
    return minAmount.toFixed(2);
  };
  
  const estimateUSDCOutput = async () => {
    if (!swapDetails || !swapDetails.fromToken || !swapDetails.fromAmount) {
      return;
    }
    
    try {
      setIsEstimating(true);
      setSwapStep("estimating");
      
      // Get token info
      const tokenInfo = getTokenInfo(swapDetails.fromToken);
      
      // No need to estimate for USDC
      if (swapDetails.fromToken === "USDC") {
        setEstimatedUSDC(swapDetails.fromAmount.toString());
        setMinReceiveUSDC(swapDetails.fromAmount.toString());
        setNeedsApproval(true); // USDC still needs approval
        setSwapStep("approval");
        return;
      }
      
      // ETH doesn't need approval but still needs estimation
      if (swapDetails.fromToken === "ETH") {
        setNeedsApproval(false);
      } else {
        setNeedsApproval(true);
      }
      
      // Use the config with readContract
      const output = await estimateSwapOutput({
        token: swapDetails.fromToken,
        tokenAddress: tokenInfo.address,
        tokenDecimals: tokenInfo.decimals,
        amount: swapDetails.fromAmount.toString(),
        readContract: async (params) => {
          try {
            // Use wagmi v2's readContract action with your existing config
            const result = await readContract(config, {
              address: params.address,
              abi: params.abi,
              functionName: params.functionName,
              args: params.args
            });
            
            // Cast the result to bigint explicitly
            if (typeof result === 'bigint' || typeof result === 'number' || typeof result === 'string') {
              return BigInt(result.toString());
            }
            throw new Error('Unexpected result type');
          } catch (error) {
            console.error('Error reading contract:', error);
            throw error;
          }
        }
      });
      
      setEstimatedUSDC(output);
      
      // Calculate minimum with slippage
      const minAmount = calculateMinAmount(output, 0.3);
      setMinReceiveUSDC(minAmount);
      
      logger.log('ESTIMATION', `Estimated USDC output for ${swapDetails.fromAmount} ${swapDetails.fromToken}: ${output}`, {
        originalAmount: swapDetails.fromAmount,
        token: swapDetails.fromToken,
        estimatedUSDC: output,
        minUSDC: minAmount,
        slippage: "0.3%"
      });
      
      setSwapStep(needsApproval ? "approval" : "swap");
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Error estimating USDC output: ${errorMsg}`, error);
      
      if (errorMsg.includes("insufficient liquidity")) {
        setError("Insufficient liquidity for this swap. Try a smaller amount.");
      } else if (errorMsg.includes("price impact too high")) {
        setError("Price impact too high. Try a smaller amount.");
      } else {
        // Don't set error state for minor estimation issues to avoid blocking the UI
        logger.log('WARNING', `Estimation warning, continuing with default values: ${errorMsg}`);
      }
    } finally {
      setIsEstimating(false);
    }
  };

  const fetchDepositAddress = async () => {
    if (!authToken || !swapDetails || !bankDetails || !walletAddress) {
      setError("Missing required information to fetch deposit address");
      return null;
    }
    
    try {
      setLoadingDepositAddress(true);
      
      // IMPORTANT: Pass the estimated USDC amount for non-USDC tokens
      // For USDC tokens, pass null as the estimatedUSDCAmount (function will use original amount)
      const estimatedUSDCForAPI = swapDetails.fromToken !== "USDC" ? estimatedUSDC : null;
      
      logger.log('API', 'Fetching deposit address with parameters:', {
        token: swapDetails.fromToken,
        originalAmount: swapDetails.fromAmount.toString(),
        estimatedUSDC: estimatedUSDCForAPI,
        bankDetails: {
          accountNumber: bankDetails.accountNumber.substring(0, 3) + '...',
          swiftCode: bankDetails.routingNumber || bankDetails.swiftCode || 'N/A',
          accountName: bankDetails.accountName
        }
      });
      
      // CRITICAL: Make sure we're using the Swift code/bank code in the bankInstitutionName field
      // This field is required by the API to identify the bank
      const bankInstitutionName = bankDetails.routingNumber || bankDetails.swiftCode;
      
      if (!bankInstitutionName) {
        throw new Error("Bank code (Swift code) is required but missing. Please select your bank again.");
      }
      
      // Construct properly formatted bank details object for the API
      const formattedBankDetails = {
        accountNumber: bankDetails.accountNumber,
        bankInstitutionName: bankInstitutionName, // Using Swift code from routingNumber field
        accountName: bankDetails.accountName,
        memo: "Token to NGN Swap"
      };
      
      // Log the request details (with sensitive info masked)
      logger.log('API', 'Preparing offramp API request', {
        token: swapDetails.fromToken,
        amount: swapDetails.fromAmount.toString(),
        estimatedUSDC: estimatedUSDCForAPI,
        bankDetails: {
          ...formattedBankDetails,
          accountNumber: `${formattedBankDetails.accountNumber.substring(0, 3)}...`
        }
      });
      
      try {
        const address = await fetchOfframpDepositAddress(
          authToken,
          swapDetails.fromToken,
          swapDetails.fromAmount.toString(),
          estimatedUSDCForAPI, // Pass the estimated USDC amount
          walletAddress,
          formattedBankDetails // Pass properly formatted bank details
        );
        
        if (!address) {
          throw new Error("Failed to obtain deposit address");
        }
        
        // Store the deposit address for future use
        setDepositAddress(address);
        logger.log('TRANSACTION', `Successfully obtained deposit address: ${address.substring(0, 6)}...`);
        return address;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        
        // More descriptive error messages for specific scenarios
        if (errorMsg.includes("bank")) {
          setError(`Bank validation error: ${errorMsg}. Please check your bank details.`);
        } else if (errorMsg.includes("server") || errorMsg.includes("500")) {
          setError(`Server error: The service is temporarily unavailable. Please try again later.`);
        } else if (errorMsg.includes("timeout")) {
          setError(`Request timed out. The server may be busy. Please try again.`);
        } else {
          setError(`Failed to obtain deposit address: ${errorMsg}`);
        }
        
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Deposit address fetch error: ${errorMsg}`, error);
      setError(`Failed to get deposit address: ${errorMsg}`);
      return null;
    } finally {
      setLoadingDepositAddress(false);
    }
  };

  // Handle approval step
  const handleApproval = async () => {
    try {
      if (!swapDetails || !walletAddress) {
        setError("Missing swap details or wallet not connected");
        return;
      }
      
      const { fromToken, fromAmount } = swapDetails;
      
      logger.log('TRANSACTION', `Starting approval for ${fromToken}`);
      setTransactionStatus("pending");
      
      const isApproved = await approveTokenSpending(
        fromToken,
        fromAmount.toString()
      );
      
      if (!isApproved) {
        throw new Error("Token approval failed");
      }
      
      logger.log('TRANSACTION', `${fromToken} approved successfully`);
      setIsApprovalComplete(true);
      setSwapStep("swap");
      setTransactionStatus("idle");
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setError(`Approval failed: ${errorMsg}`);
      setTransactionStatus("error");
    }
  };

  // Handle swap step
  const handleSwap = async () => {
    try {
      if (!swapDetails || !walletAddress) {
        setError("Missing swap details or wallet not connected");
        return;
      }
      
      // Validate bank details
      if (!bankDetails?.accountNumber || bankDetails.accountNumber.length < 10) {
        setError("Please enter a valid bank account number (minimum 10 digits)");
        return;
      }
      
      if (!bankDetails?.bankName) {
        setError("Bank name is required. Please select your bank.");
        return;
      }
      
      if (!bankDetails?.accountName) {
        setError("Account name is required. Please verify your bank account.");
        return;
      }
      
      // Check if routing number (Swift code) is available
      if (!bankDetails?.routingNumber && !bankDetails?.swiftCode) {
        setError("Bank code (Swift code) is required. Please select a valid bank.");
        return;
      }
      
      // First, get the deposit address if we don't have one yet
      let liquidityProviderAddress = depositAddress;
      if (!liquidityProviderAddress) {
        logger.log('TRANSACTION', 'Fetching deposit address before proceeding');
        liquidityProviderAddress = await fetchDepositAddress();
        
        if (!liquidityProviderAddress) {
          return;
        }
      }
      
      const { fromToken, fromAmount, rate } = swapDetails;
      
      logger.log('TRANSACTION', `Starting swap for ${fromToken}`);
      setTransactionStatus("pending");
      
      // Choose the appropriate contract function based on token
      let txHash: string | null = null;
      
      try {
        if (fromToken === "ETH") {
          // For ETH, use createOrderWithSwap (direct, no wrapping)
          const minOutput = minReceiveUSDC || "0";
          
          logger.log('TRANSACTION', `Creating order for ETH with min output: ${minOutput}`);
          
          txHash = await createOrderWithSwapAndConversion({
            tokenSymbol: fromToken,
            tokenAmount: fromAmount.toString(),
            minOutputAmount: minOutput,
            rate: rate,
            targetCurrency: "NGN",
            liquidityProviderAddress,
            estimatedUSDCAmount: estimatedUSDC
          });
        } else if (fromToken === "USDC") {
          // For USDC, use simple createOrder
          logger.log('TRANSACTION', `Creating direct order for USDC`);
          
          txHash = await createTokenOrder({
            tokenSymbol: fromToken,
            tokenAmount: fromAmount.toString(),
            rate: rate,
            targetCurrency: "NGN",
            liquidityProviderAddress
          });
        } else {
          // For other tokens (USDT, WETH, ZORA, DEGEN), use createOrderWithCustomPath
          const minOutput = minReceiveUSDC || "0";
          
          logger.log('TRANSACTION', `Creating order with custom path for ${fromToken} with min output: ${minOutput}`);
          
          txHash = await createOrderWithPath({
            tokenSymbol: fromToken,
            tokenAmount: fromAmount.toString(),
            minOutputAmount: minOutput,
            rate: rate,
            targetCurrency: "NGN",
            liquidityProviderAddress,
            estimatedUSDCAmount: estimatedUSDC
          });
        }
        
        if (!txHash) {
          throw new Error("Failed to create order - no transaction hash returned");
        }
        
        logger.log('TRANSACTION', `Swap order created successfully with hash: ${txHash}`);
        
        // Store relevant order details in localStorage for tracking
        localStorage.setItem("currentOrderId", txHash);
        localStorage.setItem("orderStatus", "PENDING");
        localStorage.setItem("orderType", "TOKEN_TO_NGN");
        localStorage.setItem("estimatedUSDC", estimatedUSDC || "");
        
        // Update transaction status to success
        setTransactionStatus("success");
        setSwapStep("complete");
        
        // Call the onSuccess callback
        onSuccess(txHash);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        logger.log('ERROR', `Swap order creation failed: ${errorMsg}`, error);
        
        // Improved error messages for common issues
        if (errorMsg.includes("user rejected")) {
          setError("Transaction was rejected in your wallet. Please try again.");
        } else if (errorMsg.includes("insufficient funds")) {
          setError("You have insufficient funds in your wallet to complete this transaction.");
        } else if (errorMsg.includes("gas")) {
          setError("Gas estimation failed. Your transaction may fail or the network is congested.");
        } else if (errorMsg.includes("execution reverted")) {
          setError("Transaction would fail. This might be due to insufficient liquidity or high price impact.");
        } else {
          setError(`Failed to create swap order: ${errorMsg}`);
        }
        
        setTransactionStatus("error");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Unexpected error in swap flow: ${errorMsg}`, error);
      setError(`An unexpected error occurred: ${errorMsg}`);
      setTransactionStatus("error");
    }
  };
  
  // Function to truncate address for display
  const truncateAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleSaveAccountNumber = () => {
    if (!accountNumberInput || accountNumberInput.length < 10) {
      setError('Please enter a valid account number (minimum 10 digits)');
      return;
    }
    
    if (bankDetails && onBankVerified) {
      const updatedDetails = {
        ...bankDetails,
        accountNumber: accountNumberInput
      };
      onBankVerified(updatedDetails);
      setIsEditingAccount(false);
      setError(null);
    }
  };

  // Handle transaction success - only for monitoring, main success is handled in handleSwap
  useEffect(() => {
    if (isTxSuccess && txHash && swapStep === "swap") {
      logger.log('TRANSACTION', `Transaction confirmed on blockchain: ${txHash}`);
      // Additional confirmation that transaction was mined
      // The success state should already be set by handleSwap
    }
  }, [isTxSuccess, txHash, swapStep]);
  
  // Update error from swap hook
  useEffect(() => {
    if (swapError) {
      setError(swapError);
      setTransactionStatus("error");
    }
  }, [swapError]);

  // Update account number input when bank details change
  useEffect(() => {
    setAccountNumberInput(bankDetails?.accountNumber || '');
  }, [bankDetails]);
  
  // Reset state when modal opens and estimate USDC
  useEffect(() => {
    if (isOpen && swapDetails) {
      setError(null);
      setDepositAddress(null);
      setIsEditingAccount(false);
      setEstimatedUSDC(null);
      setMinReceiveUSDC(null);
      setSwapStep("estimating");
      setTransactionStatus("idle");
      setNeedsApproval(false);
      setIsApprovalComplete(false);
      
      // Initialize account number input with current bank details
      setAccountNumberInput(bankDetails?.accountNumber || '');
      
      // Check if user is authenticated and has a wallet
      if (!authenticated || !walletAddress) {
        setError("Please connect your wallet to proceed.");
        return;
      }
      
      logger.log('MODAL', 'Token to NGN confirmation modal opened', swapDetails);
      
      // Estimate USDC output
      estimateUSDCOutput();
    }
  }, [isOpen, swapDetails, authenticated, walletAddress, bankDetails]);
  
  if (!swapDetails) return null;

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };
  
  const modalVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } }
  };
  
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Get the appropriate icon for the token
  const getTokenIcon = (token: string) => {
    if (token === "ETH" || token === "WETH") {
      return (
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 256 417" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" className="text-blue-600 dark:text-blue-400">
            <path fill="currentColor" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path fill="currentColor" d="M127.962 0L0 212.32l127.962 75.639V154.158z"/>
            <path fill="currentColor" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z"/>
            <path fill="currentColor" d="M127.962 416.905v-104.72L0 236.585z"/>
            <path fill="currentColor" d="M127.961 287.958l127.96-75.637-127.96-58.162z"/>
            <path fill="currentColor" d="M0 212.32l127.96 75.638v-133.8z"/>
          </svg>
        </div>
      );
    } else if (token.includes("USD") || token === "USDC" || token === "USDT") {
      return (
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <DollarSign className="text-green-600 dark:text-green-400" size={20} />
        </div>
      );
    } else if (token === "NGN") {
      return (
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <span className="text-green-600 dark:text-green-400 font-bold text-lg">₦</span>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <DollarSign className="text-purple-600 dark:text-purple-400" size={20} />
        </div>
      );
    }
  };

  // Progress tracker component with improved UI
  const ProgressTracker = () => (
    <div className="relative pt-1">
      <div className="flex mb-3 items-center justify-between">
        {/* Step 1: Estimate Rate */}
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
            swapStep === "estimating" ? "bg-blue-500" : "bg-green-500"
          } text-white text-sm mr-2`}>
            {swapStep === "estimating" && isEstimating ? (
              <Loader className="animate-spin" size={14} />
            ) : (
              <CheckCircle size={14} />
            )}
          </div>
          <span className={`text-sm ${
            swapStep === "estimating" ? "text-blue-500 font-medium" : "text-green-500 font-medium"
          }`}>
            Estimate Rate
          </span>
        </div>
        
        {/* Step 2: Approve Tokens (conditional) */}
        {needsApproval && (
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
              swapStep === "approval" 
                ? "bg-blue-500" 
                : (swapStep === "swap" || swapStep === "complete") 
                  ? "bg-green-500" 
                  : "bg-gray-200 dark:bg-gray-700"
            } text-white text-sm mr-2`}>
              {swapStep === "approval" && transactionStatus === "pending" ? (
                <Loader className="animate-spin" size={14} />
              ) : (swapStep === "approval" || swapStep === "swap" || swapStep === "complete") ? (
                <CheckCircle size={14} />
              ) : (
                <span>2</span>
              )}
            </div>
            <span className={`text-sm ${
              swapStep === "approval" 
                ? "text-blue-500 font-medium" 
                : (swapStep === "swap" || swapStep === "complete") 
                  ? "text-green-500 font-medium" 
                  : "text-gray-400"
            }`}>
              Approve Tokens
            </span>
          </div>
        )}
        
        {/* Step 3: Complete Swap */}
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full ${
            swapStep === "swap" 
              ? "bg-blue-500"
              : swapStep === "complete" 
                ? "bg-green-500" 
                : "bg-gray-200 dark:bg-gray-700"
          } text-white text-sm mr-2`}>
            {swapStep === "swap" && transactionStatus === "pending" ? (
              <Loader className="animate-spin" size={14} />
            ) : swapStep === "complete" ? (
              <CheckCircle size={14} />
            ) : (
              <span>{needsApproval ? "3" : "2"}</span>
            )}
          </div>
          <span className={`text-sm ${
            swapStep === "swap" 
              ? "text-blue-500 font-medium" 
              : swapStep === "complete" 
                ? "text-green-500 font-medium" 
                : "text-gray-400"
          }`}>
            Complete Swap
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="overflow-hidden h-2 mb-1 text-xs flex bg-gray-200 dark:bg-gray-700 rounded-full">
        <div 
          className="bg-blue-500" 
          style={{ 
            width: swapStep === "estimating" 
              ? "33%" 
              : swapStep === "approval" 
                ? "66%" 
                : "100%" 
          }}
        ></div>
      </div>
    </div>
  );

  // Determine current action button text and handler
  const getCurrentActionButton = () => {
    if (swapStep === "complete") {
      return null; // No action button for complete state
    }
    
    if (swapStep === "approval" && needsApproval && !isApprovalComplete) {
      return {
        text: transactionStatus === "pending" ? "Approving..." : "Approve Token",
        handler: handleApproval,
        disabled: transactionStatus === "pending" || loadingDepositAddress || !!error ||
                 !bankDetails?.accountNumber || bankDetails.accountNumber.length < 10 ||
                 isEditingAccount || isEstimating,
        loading: transactionStatus === "pending"
      };
    }
    
    if (swapStep === "swap" || (needsApproval && isApprovalComplete)) {
      return {
        text: transactionStatus === "pending" ? "Swapping..." : "Confirm Swap",
        handler: handleSwap,
        disabled: transactionStatus === "pending" || loadingDepositAddress || !!error ||
                 !bankDetails?.accountNumber || bankDetails.accountNumber.length < 10 ||
                 isEditingAccount || isEstimating,
        loading: transactionStatus === "pending"
      };
    }
    
// Default case (estimating or waiting)
return {
  text: isEstimating ? "Estimating..." : "Preparing...",
  handler: () => {},
  disabled: true,
  loading: isEstimating
};
};

const actionButton = getCurrentActionButton();

return (
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={overlayVariants}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        className="bg-gray-900 text-white rounded-2xl p-5 max-w-md w-full shadow-xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            {swapStep === "complete" ? "Swap Successful" : "Confirm Token Swap"}
          </h2>
          <button
            onClick={onClose}
            disabled={transactionStatus === "pending" || loadingDepositAddress}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        {/* Swap Details */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {getTokenIcon(swapDetails.fromToken)}
            <div>
              <p className="text-sm text-gray-400">
                From
              </p>
              <p className="font-semibold text-white">
                {swapDetails.fromAmount} {swapDetails.fromToken}
              </p>
            </div>
          </div>

          <ArrowRight className="text-gray-400" size={24} />

          <div className="flex items-center gap-3">
            {getTokenIcon(swapDetails.toToken)}
            <div className="text-right">
              <p className="text-sm text-gray-400">
                To
              </p>
              <p className="font-semibold text-white">
                {swapDetails.toAmount} {swapDetails.toToken}
              </p>
            </div>
          </div>
        </div>

        {/* USDC Estimation Section */}
        {swapDetails.fromToken !== "USDC" && (
          <div className="mb-5 p-4 bg-yellow-950/30 rounded-lg border border-yellow-900/50">
            <div className="flex items-start gap-2">
              <RefreshCw className="text-yellow-500 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  Estimated USDC Conversion
                </p>
                {isEstimating ? (
                  <div className="flex items-center mt-2">
                    <Loader className="animate-spin text-yellow-500 mr-2" size={16} />
                    <p className="text-sm text-yellow-500">
                      Calculating best rate...
                    </p>
                  </div>
                ) : estimatedUSDC ? (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-400">
                      Your {swapDetails.fromAmount} {swapDetails.fromToken} will first be converted to approximately <span className="font-bold">{estimatedUSDC} USDC</span>
                    </p>
                    <p className="text-xs text-yellow-500 mt-2">
                      Minimum received (with 0.3% slippage): {minReceiveUSDC} USDC
                    </p>
                    <div className="flex items-start gap-1 mt-2 text-xs text-yellow-500">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      <p className="italic">
                        If the transaction fails, you'll be refunded this amount in USDC.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-500 mt-2">
                    Could not estimate USDC output. Please try again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction Progress */}
        {swapStep !== "complete" && (
          <div className="mb-5">
            <div className="flex justify-between mb-2">
              <p className="text-sm font-medium text-gray-300">Transaction Progress</p>
            </div>
            
            <ProgressTracker />
          </div>
        )}

        {/* Exchange Rate */}
        <div className="bg-gray-800 rounded-lg p-4 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              Exchange Rate
            </span>
            <span className="font-medium text-white">
              1 {swapDetails.fromToken} = {swapDetails.rate}{" "}
              {swapDetails.toToken}
            </span>
          </div>
        </div>

        {/* Bank Details Section */}
        {bankDetails && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">
                Recipient Bank Details
              </span>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg mb-3 border border-gray-700">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Account Name</span>
                <span className="text-sm font-medium text-white">{bankDetails.accountName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Bank Name</span>
                <span className="text-sm font-medium text-white">{bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Bank Code</span>
                <span>{bankDetails.routingNumber}</span>
              </div>
            </div>

            {/* Account Number Input Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">
                  Account Number
                </span>
                {!isEditingAccount && (
                  <button 
                    onClick={() => setIsEditingAccount(true)}
                    disabled={transactionStatus === "pending"}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 className="mr-1" size={12} />
                    Edit
                  </button>
                )}
              </div>

              {isEditingAccount ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={accountNumberInput}
                    onChange={(e) => {
                      // Only allow digits and limit to 10 characters
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setAccountNumberInput(value);
                    }}
                    placeholder="Enter your account number"
                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditingAccount(false);
                        setAccountNumberInput(bankDetails.accountNumber || '');
                        setError(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAccountNumber}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Account Number</span>
                    <span className="text-sm font-medium text-white">
                      {bankDetails.accountNumber || 'Not provided'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wallet Address Section */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">
              Your Wallet Address
            </span>
          </div>

          <div className="flex items-center gap-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <Wallet className="text-gray-400" size={16} />
            <span className="text-sm text-gray-300 font-mono truncate">
              {walletAddress 
                ? truncateAddress(walletAddress) 
                : "Wallet not connected"}
            </span>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="bg-blue-900/20 rounded-lg p-4 mb-5 border border-blue-900/50">
          <div className="flex items-start gap-2">
            <Info className="text-blue-400 mt-0.5" size={18} />
            <div>
              <p className="text-sm text-blue-400">
                {swapDetails.fromToken === "ETH" 
                  ? "You'll be asked to confirm this transaction in your wallet. ETH will be directly used for the transaction." 
                  : needsApproval && !isApprovalComplete
                    ? "First, you'll need to approve the token for spending. Then you'll confirm the swap transaction."
                    : "You'll be asked to confirm this transaction in your wallet. Once confirmed, your tokens will be swapped and you'll receive NGN to your bank account."}
              </p>
              <p className="text-sm text-blue-400 mt-2 font-medium">
                If the transaction fails for any reason, you'll be refunded in USDC.
              </p>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="bg-red-900/20 rounded-lg p-4 mb-5 border border-red-900/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-red-400 mt-0.5" size={18} />
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Validation message if account number is missing */}
        {(!bankDetails?.accountNumber || bankDetails.accountNumber.length < 10) && !isEditingAccount && (
          <div className="bg-yellow-900/20 rounded-lg p-4 mb-5 border border-yellow-900/50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-yellow-500 mt-0.5" size={18} />
              <p className="text-sm text-yellow-500">
                Please enter a valid bank account number (minimum 10 digits) to receive the NGN payment.
              </p>
            </div>
          </div>
        )}

        {/* Transaction status if waiting */}
        {(loadingDepositAddress || transactionStatus === "pending" || transactionStatus === "success") && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={stepVariants}
            className="bg-indigo-900/20 rounded-lg p-4 mb-5 border border-indigo-900/50"
          >
            <div className="flex items-center gap-2">
              {loadingDepositAddress ? (
                <>
                  <Loader className="animate-spin text-indigo-400" size={18} />
                  <p className="text-sm text-indigo-400">
                    Fetching deposit address...
                  </p>
                </>
              ) : transactionStatus === "pending" ? (
                <>
                  <Loader className="animate-spin text-indigo-400" size={18} />
                  <p className="text-sm text-indigo-400">
                    {swapStep === "approval" ? "Approving tokens..." : "Transaction in progress..."}
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-400" size={18} />
                  <p className="text-sm text-indigo-400">
                    Transaction confirmed!
                  </p>
                </>
              )}
            </div>
            {txHash && (
              <p className="text-xs text-indigo-400 mt-2 font-mono">
                Transaction Hash: {truncateAddress(txHash)}
              </p>
            )}
            {depositAddress && (
              <p className="text-xs text-indigo-400 mt-1">
                Deposit Address: {truncateAddress(depositAddress)}
              </p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 sticky bottom-0 pb-2 pt-2 bg-gray-900">
          <button
            onClick={onClose}
            disabled={transactionStatus === "pending" || loadingDepositAddress}
            className="flex-1 px-4 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {transactionStatus === "success" ? "Close" : "Cancel"}
          </button>
          {actionButton && (
            <button
              onClick={actionButton.handler}
              disabled={actionButton.disabled}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
              {actionButton.loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  {actionButton.text}
                </>
              ) : (
                actionButton.text
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
);
};

export default TokenToNGNConfirmModal;