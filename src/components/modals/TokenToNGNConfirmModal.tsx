import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   X,
   ArrowRight,
   Info,
   Wallet,
   CheckCircle,
   AlertCircle,
   Loader,
   Edit2,
   RefreshCw,
   DollarSign,
   AlertTriangle,
   Clock,
   TrendingUp,
   CreditCard,
   Share2,
   Twitter,
   Download,
   Copy,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { useTokenSwap } from "../../contracts/hooks/useTokenSwap";
import { fetchOfframpDepositAddress } from "../../services/contractService";
import { estimateSwapOutput } from "../../services/swapEstimationService";
import { tokens } from "../../constants/swapConstants";
import { config } from "../../wagmiConfig";
import html2canvas from "html2canvas";

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

// Enhanced types for offramp tracking
type SwapStep = "estimating" | "approval" | "swap" | "converting" | "complete";
type TransactionStatus = "idle" | "pending" | "success" | "error";
type OfframpStatus =
   | "PENDING"
   | "PROCESSING"
   | "COMPLETED"
   | "FAILED"
   | "CANCELLED";

interface OfframpProgressData {
   orderId: string;
   status: OfframpStatus;
   progress: number;
   estimatedTime?: string;
   currentStep?: string;
   transactionHash?: string;
   lastUpdated?: string;
}

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
   authToken,
}) => {
   // State variables
   const [error, setError] = useState<string | null>(null);
   const [loadingDepositAddress, setLoadingDepositAddress] = useState(false);
   const [depositAddress, setDepositAddress] = useState<string | null>(null);
   const [isEditingAccount, setIsEditingAccount] = useState(false);
   const [accountNumberInput, setAccountNumberInput] = useState(
      bankDetails?.accountNumber || ""
   );
   const [estimatedUSDC, setEstimatedUSDC] = useState<string | null>(null);
   const [isEstimating, setIsEstimating] = useState(false);
   const [minReceiveUSDC, setMinReceiveUSDC] = useState<string | null>(null);
   const [needsApproval, setNeedsApproval] = useState(false);
   const [isApprovalComplete, setIsApprovalComplete] = useState(false);

   // Enhanced state for offramp tracking
   const [swapStep, setSwapStep] = useState<SwapStep>("estimating");
   const [transactionStatus, setTransactionStatus] =
      useState<TransactionStatus>("idle");
   const [offrampOrderId, setOfframpOrderId] = useState<string | null>(null);
   const [offrampProgress, setOfframpProgress] =
      useState<OfframpProgressData | null>(null);
   const [isPollingActive, setIsPollingActive] = useState(false);
   const [pollingInterval, setPollingInterval] =
      useState<NodeJS.Timeout | null>(null);

   // Twitter sharing state
   const [showTwitterShare, setShowTwitterShare] = useState(false);
   const [isGeneratingImage, setIsGeneratingImage] = useState(false);

   // Fixed: Get wallet state from both Privy and Wagmi
   const { user, authenticated } = usePrivy();
   const { address: walletAddress, isConnected } = useAccount();

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
      txHash,
   } = useTokenSwap();

   // API Base URL
   const API_BASE_URL =
      import.meta.env.VITE_API_URL || "https://aboki-api.onrender.com/api";

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
      },
   }; // Wallet Sync Status Component
   const WalletSyncStatus = () => {
      if (authenticated && !isConnected) {
         return (
            <div className="bg-yellow-900/20 rounded-lg p-4 mb-5 border border-yellow-900/50">
               <div className="flex items-center gap-2">
                  <Loader className="animate-spin text-yellow-500" size={18} />
                  <div>
                     <p className="text-sm font-medium text-yellow-500">
                        Syncing Wallet...
                     </p>
                     <p className="text-xs text-yellow-400 mt-1">
                        Connecting your Privy wallet with Wagmi. This usually
                        takes a few seconds.
                     </p>
                  </div>
               </div>
            </div>
         );
      }

      if (authenticated && isConnected && walletAddress) {
         return (
            <div className="bg-green-900/20 rounded-lg p-4 mb-5 border border-green-900/50">
               <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={18} />
                  <div>
                     <p className="text-sm font-medium text-green-500">
                        Wallet Connected
                     </p>
                     <p className="text-xs text-green-400 mt-1 font-mono">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                     </p>
                  </div>
               </div>
            </div>
         );
      }

      return null;
   };

   // Get token info from the tokens array
   const getTokenInfo = (symbol: string) => {
      const token = tokens.find((t) => t.symbol === symbol);
      if (!token) {
         throw new Error(`Token ${symbol} not found`);
      }

      return {
         address: token.address,
         decimals: token.decimals,
         symbol: token.symbol,
      };
   };

   // Calculate minimum amount with slippage
   const calculateMinAmount = (
      amount: string,
      slippagePercent: number = 0.5
   ): string => {
      if (!amount || amount === "0") return "0";

      const parsedAmount = parseFloat(amount);
      const slippage = slippagePercent / 100;
      const minAmount = parsedAmount * (1 - slippage);

      return minAmount.toFixed(2);
   };

   // Function to truncate address for display
   const truncateAddress = (address: string): string => {
      if (!address || address.length < 10) return address;
      return `${address.substring(0, 6)}...${address.substring(
         address.length - 4
      )}`;
   };

   // Get the appropriate icon for the token
   const getTokenIcon = (token: string) => {
      if (token === "ETH" || token === "WETH") {
         return (
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
               <svg
                  width="20"
                  height="20"
                  viewBox="0 0 256 417"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid"
                  className="text-blue-600 dark:text-blue-400">
                  <path
                     fill="currentColor"
                     d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"
                  />
                  <path
                     fill="currentColor"
                     d="M127.962 0L0 212.32l127.962 75.639V154.158z"
                  />
                  <path
                     fill="currentColor"
                     d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z"
                  />
                  <path
                     fill="currentColor"
                     d="M127.962 416.905v-104.72L0 236.585z"
                  />
                  <path
                     fill="currentColor"
                     d="M127.961 287.958l127.96-75.637-127.96-58.162z"
                  />
                  <path
                     fill="currentColor"
                     d="M0 212.32l127.96 75.638v-133.8z"
                  />
               </svg>
            </div>
         );
      } else if (
         token.includes("USD") ||
         token === "USDC" ||
         token === "USDT"
      ) {
         return (
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
               <DollarSign
                  className="text-green-600 dark:text-green-400"
                  size={20}
               />
            </div>
         );
      } else if (token === "NGN") {
         return (
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
               <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                  ₦
               </span>
            </div>
         );
      } else {
         return (
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
               <DollarSign
                  className="text-purple-600 dark:text-purple-400"
                  size={20}
               />
            </div>
         );
      }
   }; // API Functions for offramp operations
   const startOfframpPolling = async (orderId: string): Promise<boolean> => {
      try {
         const response = await fetch(
            `${API_BASE_URL}/ramp/offramp/${orderId}/start-polling`,
            {
               method: "POST",
               headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
               },
            }
         );

         if (!response.ok) {
            throw new Error(`Failed to start polling: ${response.statusText}`);
         }

         const data = await response.json();
         logger.log("POLLING", `Started polling for order ${orderId}`, data);
         return true;
      } catch (error) {
         logger.log(
            "ERROR",
            `Failed to start polling for order ${orderId}`,
            error
         );
         return false;
      }
   };

   const stopOfframpPolling = async (orderId: string): Promise<boolean> => {
      try {
         const response = await fetch(
            `${API_BASE_URL}/ramp/offramp/${orderId}/stop-polling`,
            {
               method: "POST",
               headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
               },
            }
         );

         if (!response.ok) {
            throw new Error(`Failed to stop polling: ${response.statusText}`);
         }

         logger.log("POLLING", `Stopped polling for order ${orderId}`);
         return true;
      } catch (error) {
         logger.log(
            "ERROR",
            `Failed to stop polling for order ${orderId}`,
            error
         );
         return false;
      }
   };

   const checkOfframpStatus = async (
      orderId: string
   ): Promise<OfframpProgressData | null> => {
      try {
         const response = await fetch(
            `${API_BASE_URL}/ramp/offramp/status/${orderId}`,
            {
               method: "GET",
               headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
               },
            }
         );

         if (!response.ok) {
            throw new Error(`Failed to check status: ${response.statusText}`);
         }

         const data = await response.json();

         const progressData: OfframpProgressData = {
            orderId: data.orderId || orderId,
            status: data.status || "PENDING",
            progress: data.progress || 0,
            estimatedTime: data.estimatedTime,
            currentStep: data.currentStep,
            transactionHash: data.transactionHash,
            lastUpdated: new Date().toISOString(),
         };

         logger.log(
            "STATUS_CHECK",
            `Checked status for order ${orderId}`,
            progressData
         );
         return progressData;
      } catch (error) {
         logger.log(
            "ERROR",
            `Failed to check status for order ${orderId}`,
            error
         );
         return null;
      }
   };

   // Polling logic for offramp progress
   const startProgressPolling = useCallback(
      async (orderId: string) => {
         if (isPollingActive) return;

         setIsPollingActive(true);
         logger.log(
            "POLLING",
            `Starting progress polling for order ${orderId}`
         );

         await startOfframpPolling(orderId);

         const interval = setInterval(async () => {
            const progressData = await checkOfframpStatus(orderId);

            if (progressData) {
               setOfframpProgress(progressData);

               if (progressData.status === "COMPLETED") {
                  logger.log(
                     "CONVERSION",
                     `NGN conversion completed for order ${orderId}`
                  );
                  setSwapStep("complete");
                  setTransactionStatus("success");

                  clearInterval(interval);
                  setPollingInterval(null);
                  setIsPollingActive(false);
                  await stopOfframpPolling(orderId);

                  onSuccess(progressData.transactionHash || orderId);
               } else if (
                  progressData.status === "FAILED" ||
                  progressData.status === "CANCELLED"
               ) {
                  logger.log(
                     "ERROR",
                     `NGN conversion failed for order ${orderId}`,
                     progressData
                  );
                  setError(
                     `Conversion failed: ${
                        progressData.currentStep || "Unknown error"
                     }`
                  );
                  setTransactionStatus("error");

                  clearInterval(interval);
                  setPollingInterval(null);
                  setIsPollingActive(false);
                  await stopOfframpPolling(orderId);
               }
            }
         }, 3000);

         setPollingInterval(interval);
      },
      [isPollingActive, authToken, onSuccess]
   );

   // Stop polling when component unmounts or modal closes
   useEffect(() => {
      return () => {
         if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
         }
         if (isPollingActive && offrampOrderId) {
            stopOfframpPolling(offrampOrderId);
            setIsPollingActive(false);
         }
      };
   }, [pollingInterval, isPollingActive, offrampOrderId]);

   const estimateUSDCOutput = async () => {
      if (!swapDetails || !swapDetails.fromToken || !swapDetails.fromAmount) {
         return;
      }

      try {
         setIsEstimating(true);
         setSwapStep("estimating");

         const tokenInfo = getTokenInfo(swapDetails.fromToken);

         if (swapDetails.fromToken === "USDC") {
            setEstimatedUSDC(swapDetails.fromAmount.toString());
            setMinReceiveUSDC(swapDetails.fromAmount.toString());
            setNeedsApproval(true);
            setSwapStep("approval");
            return;
         }

         if (swapDetails.fromToken === "ETH") {
            setNeedsApproval(false);
         } else {
            setNeedsApproval(true);
         }

         const output = await estimateSwapOutput({
            token: swapDetails.fromToken,
            tokenAddress: tokenInfo.address,
            tokenDecimals: tokenInfo.decimals,
            amount: swapDetails.fromAmount.toString(),
            readContract: async (params) => {
               try {
                  const result = await readContract(config, {
                     address: params.address,
                     abi: params.abi,
                     functionName: params.functionName,
                     args: params.args,
                  });

                  if (
                     typeof result === "bigint" ||
                     typeof result === "number" ||
                     typeof result === "string"
                  ) {
                     return BigInt(result.toString());
                  }
                  throw new Error("Unexpected result type");
               } catch (error) {
                  console.error("Error reading contract:", error);
                  throw error;
               }
            },
         });

         setEstimatedUSDC(output);
         const minAmount = calculateMinAmount(output, 0.3);
         setMinReceiveUSDC(minAmount);

         logger.log(
            "ESTIMATION",
            `Estimated USDC output for ${swapDetails.fromAmount} ${swapDetails.fromToken}: ${output}`,
            {
               originalAmount: swapDetails.fromAmount,
               token: swapDetails.fromToken,
               estimatedUSDC: output,
               minUSDC: minAmount,
               slippage: "0.3%",
            }
         );

         setSwapStep(needsApproval ? "approval" : "swap");
      } catch (error) {
         const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
         logger.log(
            "ERROR",
            `Error estimating USDC output: ${errorMsg}`,
            error
         );

         if (errorMsg.includes("insufficient liquidity")) {
            setError(
               "Insufficient liquidity for this swap. Try a smaller amount."
            );
         } else if (errorMsg.includes("price impact too high")) {
            setError("Price impact too high. Try a smaller amount.");
         } else {
            logger.log(
               "WARNING",
               `Estimation warning, continuing with default values: ${errorMsg}`
            );
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

         const estimatedUSDCForAPI =
            swapDetails.fromToken !== "USDC" ? estimatedUSDC : null;

         const bankInstitutionName =
            bankDetails.routingNumber || bankDetails.swiftCode;

         if (!bankInstitutionName) {
            throw new Error(
               "Bank code (Swift code) is required but missing. Please select your bank again."
            );
         }

         const formattedBankDetails = {
            accountNumber: bankDetails.accountNumber,
            bankInstitutionName: bankInstitutionName,
            accountName: bankDetails.accountName,
            memo: "Token to NGN Swap",
         };

         const address = await fetchOfframpDepositAddress(
            authToken,
            swapDetails.fromToken,
            swapDetails.fromAmount.toString(),
            estimatedUSDCForAPI,
            walletAddress,
            formattedBankDetails
         );

         if (!address) {
            throw new Error("Failed to obtain deposit address");
         }

         setDepositAddress(address);
         logger.log(
            "TRANSACTION",
            `Successfully obtained deposit address: ${address.substring(
               0,
               6
            )}...`
         );
         return address;
      } catch (error) {
         const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
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

         logger.log("TRANSACTION", `Starting approval for ${fromToken}`);
         setTransactionStatus("pending");

         const isApproved = await approveTokenSpending(
            fromToken,
            fromAmount.toString()
         );

         if (!isApproved) {
            throw new Error("Token approval failed");
         }

         logger.log("TRANSACTION", `${fromToken} approved successfully`);
         setIsApprovalComplete(true);
         setSwapStep("swap");
         setTransactionStatus("idle");
      } catch (error) {
         const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
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
         if (
            !bankDetails?.accountNumber ||
            bankDetails.accountNumber.length < 10
         ) {
            setError(
               "Please enter a valid bank account number (minimum 10 digits)"
            );
            return;
         }

         if (!bankDetails?.bankName) {
            setError("Bank name is required. Please select your bank.");
            return;
         }

         if (!bankDetails?.accountName) {
            setError(
               "Account name is required. Please verify your bank account."
            );
            return;
         }

         if (!bankDetails?.routingNumber && !bankDetails?.swiftCode) {
            setError(
               "Bank code (Swift code) is required. Please select a valid bank."
            );
            return;
         }

         let liquidityProviderAddress = depositAddress;
         if (!liquidityProviderAddress) {
            logger.log(
               "TRANSACTION",
               "Fetching deposit address before proceeding"
            );
            liquidityProviderAddress = await fetchDepositAddress();

            if (!liquidityProviderAddress) {
               return;
            }
         }

         const { fromToken, fromAmount, rate } = swapDetails;

         logger.log("TRANSACTION", `Starting swap for ${fromToken}`);
         setTransactionStatus("pending");

         let txHash: string | null = null;

         try {
            if (fromToken === "ETH") {
               const minOutput = minReceiveUSDC || "0";

               txHash = await createOrderWithSwapAndConversion({
                  tokenSymbol: fromToken,
                  tokenAmount: fromAmount.toString(),
                  minOutputAmount: minOutput,
                  rate: rate,
                  targetCurrency: "NGN",
                  liquidityProviderAddress,
                  estimatedUSDCAmount: estimatedUSDC,
               });
            } else if (fromToken === "USDC") {
               txHash = await createTokenOrder({
                  tokenSymbol: fromToken,
                  tokenAmount: fromAmount.toString(),
                  rate: rate,
                  targetCurrency: "NGN",
                  liquidityProviderAddress,
               });
            } else {
               const minOutput = minReceiveUSDC || "0";

               txHash = await createOrderWithPath({
                  tokenSymbol: fromToken,
                  tokenAmount: fromAmount.toString(),
                  minOutputAmount: minOutput,
                  rate: rate,
                  targetCurrency: "NGN",
                  liquidityProviderAddress,
                  estimatedUSDCAmount: estimatedUSDC,
               });
            }

            if (!txHash) {
               throw new Error(
                  "Failed to create order - no transaction hash returned"
               );
            }

            logger.log(
               "TRANSACTION",
               `Swap order created successfully with hash: ${txHash}`
            );

            localStorage.setItem("currentOrderId", txHash);
            localStorage.setItem("orderStatus", "PENDING");
            localStorage.setItem("orderType", "TOKEN_TO_NGN");
            localStorage.setItem("estimatedUSDC", estimatedUSDC || "");

            setOfframpOrderId(txHash);
            setSwapStep("converting");
            setTransactionStatus("success");

            startProgressPolling(txHash);
         } catch (error) {
            const errorMsg =
               error instanceof Error ? error.message : "Unknown error";
            logger.log(
               "ERROR",
               `Swap order creation failed: ${errorMsg}`,
               error
            );

            if (errorMsg.includes("user rejected")) {
               setError(
                  "Transaction was rejected in your wallet. Please try again."
               );
            } else if (errorMsg.includes("insufficient funds")) {
               setError(
                  "You have insufficient funds in your wallet to complete this transaction."
               );
            } else if (errorMsg.includes("gas")) {
               setError(
                  "Gas estimation failed. Your transaction may fail or the network is congested."
               );
            } else if (errorMsg.includes("execution reverted")) {
               setError(
                  "Transaction would fail. This might be due to insufficient liquidity or high price impact."
               );
            } else {
               setError(`Failed to create swap order: ${errorMsg}`);
            }

            setTransactionStatus("error");
         }
      } catch (error) {
         const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
         logger.log(
            "ERROR",
            `Unexpected error in swap flow: ${errorMsg}`,
            error
         );
         setError(`An unexpected error occurred: ${errorMsg}`);
         setTransactionStatus("error");
      }
   };

   const handleSaveAccountNumber = () => {
      if (!accountNumberInput || accountNumberInput.length < 10) {
         setError("Please enter a valid account number (minimum 10 digits)");
         return;
      }

      if (bankDetails && onBankVerified) {
         const updatedDetails = {
            ...bankDetails,
            accountNumber: accountNumberInput,
         };
         onBankVerified(updatedDetails);
         setIsEditingAccount(false);
         setError(null);
      }
   };

   // Twitter sharing functions
   const formatCurrency = (amount: number, currency: string) => {
      if (currency === "NGN") {
         return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
         }).format(amount);
      } else if (currency === "USDC") {
         return `${amount.toFixed(6)} USDC`;
      } else if (currency === "ETH") {
         return `${amount.toFixed(6)} ETH`;
      }
      return `${amount.toLocaleString()} ${currency}`;
   };

   const generateReceiptImage = async (): Promise<string | null> => {
      if (!swapDetails) return null;

      setIsGeneratingImage(true);

      try {
         const receiptElement = document.createElement("div");
         receiptElement.style.width = "600px";
         receiptElement.style.height = "800px";
         receiptElement.style.background =
            "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #3730a3 100%)";
         receiptElement.style.color = "white";
         receiptElement.style.padding = "40px";
         receiptElement.style.fontFamily = "Arial, sans-serif";
         receiptElement.style.position = "fixed";
         receiptElement.style.top = "-9999px";
         receiptElement.style.left = "-9999px";

         receiptElement.innerHTML = `
          <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="margin-bottom: 40px;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <div style="color: #10b981; font-size: 40px;">✓</div>
                </div>
                <h1 style="font-size: 48px; margin: 0 0 10px 0; font-weight: bold;">Swap Successful!</h1>
                <p style="font-size: 24px; opacity: 0.9; margin: 0;">Thanks for being a Beta Tester!</p>
              </div>
              
              <div style="background: rgba(255,255,255,0.2); border-radius: 20px; padding: 30px; margin-bottom: 40px;">
                <div style="font-size: 60px; font-weight: bold; margin-bottom: 10px;">
                  ${formatCurrency(swapDetails.toAmount, swapDetails.toToken)}
                </div>
                <div style="font-size: 24px; opacity: 0.9;">
                  Swapped from ${formatCurrency(
                     swapDetails.fromAmount,
                     swapDetails.fromToken
                  )}
                </div>
                <div style="margin-top: 30px; text-align: left;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="opacity: 0.9;">Rate:</span>
                    <span style="font-weight: 600;">1 ${
                       swapDetails.fromToken
                    } = ${swapDetails.rate} ${swapDetails.toToken}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <span style="opacity: 0.9;">Date:</span>
                    <span style="font-weight: 600;">${new Date().toLocaleDateString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="opacity: 0.9;">Status:</span>
                    <span style="font-weight: 600;">Complete</span>
                  </div>
                </div>
              </div>
              
              <div style="background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%); border-radius: 20px; padding: 30px; margin-bottom: 40px;">
                <h3 style="font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">🎉 Beta Tester Appreciation</h3>
                <p style="font-size: 20px; margin: 0;">Thanks for helping us build the future of crypto trading!</p>
              </div>
            </div>
            
            <div>
              <div style="font-size: 48px; font-weight: bold; margin-bottom: 15px;">Aboki</div>
              <p style="font-size: 20px; opacity: 0.9; margin: 0 0 10px 0;">Seamless Crypto Experience</p>
              <p style="opacity: 0.75; margin: 0 0 20px 0;">#AbokiBeta #CryptoMadeEasy</p>
              <div style="font-size: 14px; opacity: 0.75;">
                Order ID: ${(offrampOrderId || "N/A").substring(0, 8)}...
              </div>
            </div>
          </div>
        `;

         document.body.appendChild(receiptElement);

         const canvas = await html2canvas(receiptElement, {
            backgroundColor: "#7c3aed",
            scale: 2,
            width: 600,
            height: 800,
            useCORS: true,
            allowTaint: true,
         });

         document.body.removeChild(receiptElement);

         return canvas.toDataURL("image/png");
      } catch (error) {
         console.error("Error generating receipt image:", error);
         return null;
      } finally {
         setIsGeneratingImage(false);
      }
   };

  const shareToTwitter = async () => {
    if (!swapDetails) return;
    
    const imageData = await generateReceiptImage();
    if (imageData) {
      const tweetText = `🎉 Just swapped ${formatCurrency(swapDetails.fromAmount, swapDetails.fromToken)} to ${formatCurrency(swapDetails.toAmount, swapDetails.toToken)} on @AbokiHQ! 

Seamless crypto-to-NGN conversion! 🚀

Thanks for the amazing experience! 

#Crypto #DeFi #Web3 #AbokiBeta #CryptoTrading #Nigeria`;
      
      // Open Twitter with the tweet text
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(twitterUrl, '_blank');
      
      // Copy tweet text to clipboard
      try {
        await navigator.clipboard.writeText(tweetText);
        alert('Tweet text copied to clipboard! You can paste it and attach the downloaded image.');
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

   const downloadReceipt = async () => {
      const imageData = await generateReceiptImage();
      if (imageData) {
         const link = document.createElement("a");
         link.download = `aboki-swap-receipt-${
            offrampOrderId || Date.now()
         }.png`;
         link.href = imageData;
         link.click();
      }
   };

   const copyOrderId = async () => {
      const id = offrampOrderId || txHash || "";
      if (id) {
         try {
            await navigator.clipboard.writeText(id);
            alert("Order ID copied to clipboard!");
         } catch (err) {
            console.error("Failed to copy ID:", err);
         }
      }
   };

   // Enhanced Progress Tracker with NGN conversion step
   const ProgressTracker = () => (
      <div className="relative pt-1">
         <div className="flex mb-3 items-center justify-between">
            {/* Step 1: Estimate Rate */}
            <div className="flex items-center">
               <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full ${
                     swapStep === "estimating" ? "bg-blue-500" : "bg-green-500"
                  } text-white text-sm mr-2`}>
                  {swapStep === "estimating" && isEstimating ? (
                     <Loader className="animate-spin" size={14} />
                  ) : (
                     <CheckCircle size={14} />
                  )}
               </div>
               <span
                  className={`text-sm ${
                     swapStep === "estimating"
                        ? "text-blue-500 font-medium"
                        : "text-green-500 font-medium"
                  }`}>
                  Estimate
               </span>
            </div>

            {/* Step 2: Approve Tokens (conditional) */}
            {needsApproval && (
               <div className="flex items-center">
                  <div
                     className={`flex items-center justify-center w-7 h-7 rounded-full ${
                        swapStep === "approval"
                           ? "bg-blue-500"
                           : swapStep === "swap" ||
                             swapStep === "converting" ||
                             swapStep === "complete"
                           ? "bg-green-500"
                           : "bg-gray-200 dark:bg-gray-700"
                     } text-white text-sm mr-2`}>
                     {swapStep === "approval" &&
                     transactionStatus === "pending" ? (
                        <Loader className="animate-spin" size={14} />
                     ) : swapStep === "approval" ||
                       swapStep === "swap" ||
                       swapStep === "converting" ||
                       swapStep === "complete" ? (
                        <CheckCircle size={14} />
                     ) : (
                        <span>2</span>
                     )}
                  </div>
                  <span
                     className={`text-sm ${
                        swapStep === "approval"
                           ? "text-blue-500 font-medium"
                           : swapStep === "swap" ||
                             swapStep === "converting" ||
                             swapStep === "complete"
                           ? "text-green-500 font-medium"
                           : "text-gray-400"
                     }`}>
                     Approve
                  </span>
               </div>
            )}

            {/* Step 3: Swap Tokens */}
            <div className="flex items-center">
               <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full ${
                     swapStep === "swap"
                        ? "bg-blue-500"
                        : swapStep === "converting" || swapStep === "complete"
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                  } text-white text-sm mr-2`}>
                  {swapStep === "swap" && transactionStatus === "pending" ? (
                     <Loader className="animate-spin" size={14} />
                  ) : swapStep === "converting" || swapStep === "complete" ? (
                     <CheckCircle size={14} />
                  ) : (
                     <span>{needsApproval ? "3" : "2"}</span>
                  )}
               </div>
               <span
                  className={`text-sm ${
                     swapStep === "swap"
                        ? "text-blue-500 font-medium"
                        : swapStep === "converting" || swapStep === "complete"
                        ? "text-green-500 font-medium"
                        : "text-gray-400"
                  }`}>
                  Swap
               </span>
            </div>

            {/* Step 4: Convert to NGN */}
            <div className="flex items-center">
               <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full ${
                     swapStep === "converting"
                        ? "bg-blue-500"
                        : swapStep === "complete"
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                  } text-white text-sm mr-2`}>
                  {swapStep === "converting" ? (
                     <Loader className="animate-spin" size={14} />
                  ) : swapStep === "complete" ? (
                     <CheckCircle size={14} />
                  ) : (
                     <span>{needsApproval ? "4" : "3"}</span>
                  )}
               </div>
               <span
                  className={`text-sm ${
                     swapStep === "converting"
                        ? "text-blue-500 font-medium"
                        : swapStep === "complete"
                        ? "text-green-500 font-medium"
                        : "text-gray-400"
                  }`}>
                  Convert NGN
               </span>
            </div>
         </div>

         {/* Progress Bar */}
         <div className="overflow-hidden h-2 mb-1 text-xs flex bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
               className="bg-blue-500 transition-all duration-500"
               style={{
                  width:
                     swapStep === "estimating"
                        ? "25%"
                        : swapStep === "approval"
                        ? "50%"
                        : swapStep === "swap"
                        ? "75%"
                        : "100%",
               }}></div>
         </div>
      </div>
   );

   // NGN Conversion Progress Component
   const NGNConversionProgress = () => {
      if (swapStep !== "converting" || !offrampProgress) return null;

      return (
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-900/20 rounded-lg p-4 mb-5 border border-blue-900/50">
            <div className="flex items-center gap-3 mb-4">
               <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
                  <TrendingUp className="text-white" size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-blue-400">
                     Converting to NGN
                  </h3>
                  <p className="text-sm text-blue-300">
                     {offrampProgress.currentStep ||
                        "Processing your conversion..."}
                  </p>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
               <div className="flex justify-between text-sm text-blue-300 mb-2">
                  <span>Progress</span>
                  <span>{offrampProgress.progress}%</span>
               </div>
               <div className="w-full bg-blue-900/30 rounded-full h-2">
                  <div
                     className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                     style={{ width: `${offrampProgress.progress}%` }}></div>
               </div>
            </div>

            {/* Status Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
               <div className="flex items-center gap-2">
                  <Clock className="text-blue-400" size={16} />
                  <div>
                     <p className="text-blue-300">Status</p>
                     <p className="text-blue-400 font-medium">
                        {offrampProgress.status}
                     </p>
                  </div>
               </div>
               {offrampProgress.estimatedTime && (
                  <div className="flex items-center gap-2">
                     <Clock className="text-blue-400" size={16} />
                     <div>
                        <p className="text-blue-300">Est. Time</p>
                        <p className="text-blue-400 font-medium">
                           {offrampProgress.estimatedTime}
                        </p>
                     </div>
                  </div>
               )}
            </div>

            {offrampOrderId && (
               <div className="mt-4 pt-4 border-t border-blue-900/30">
                  <p className="text-xs text-blue-400">
                     Order ID:{" "}
                     <span className="font-mono">
                        {truncateAddress(offrampOrderId)}
                     </span>
                  </p>
               </div>
            )}
         </motion.div>
      );
   };

   // Twitter Share Section Component
   const TwitterShareSection = () => {
      if (swapStep !== "converting" && swapStep !== "complete") return null;

      return (
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-5 border border-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
               <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full">
                  <Share2 className="text-white" size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-blue-400">
                     Share Your Success!
                  </h3>
                  <p className="text-sm text-blue-300">
                     {swapStep === "complete"
                        ? "Let the world know about your successful swap!"
                        : "Share your ongoing transaction with friends!"}
                  </p>
               </div>
            </div>

            <div className="flex flex-col gap-3">
               <button
                  onClick={shareToTwitter}
                  disabled={isGeneratingImage}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isGeneratingImage ? (
                     <>
                        <Loader className="animate-spin" size={16} />
                        <span>Generating...</span>
                     </>
                  ) : (
                     <>
                        <Twitter size={16} />
                        <span>Share on Twitter</span>
                     </>
                  )}
               </button>

               <div className="flex gap-3">
                  <button
                     onClick={downloadReceipt}
                     disabled={isGeneratingImage}
                     className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                     <Download size={16} />
                     <span>Download</span>
                  </button>

                  <button
                     onClick={copyOrderId}
                     className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                     <Copy size={16} />
                     <span>Copy ID</span>
                  </button>
               </div>
            </div>
         </motion.div>
      );
   };

   // Determine current action button
   const getCurrentActionButton = () => {
      if (swapStep === "complete" || swapStep === "converting") {
         return null;
      }

      if (swapStep === "approval" && needsApproval && !isApprovalComplete) {
         return {
            text:
               transactionStatus === "pending"
                  ? "Approving..."
                  : "Approve Token",
            handler: handleApproval,
            disabled:
               transactionStatus === "pending" ||
               loadingDepositAddress ||
               !!error ||
               !bankDetails?.accountNumber ||
               bankDetails.accountNumber.length < 10 ||
               isEditingAccount ||
               isEstimating,
            loading: transactionStatus === "pending",
         };
      }

      if (swapStep === "swap" || (needsApproval && isApprovalComplete)) {
         return {
            text:
               transactionStatus === "pending" ? "Swapping..." : "Confirm Swap",
            handler: handleSwap,
            disabled:
               transactionStatus === "pending" ||
               loadingDepositAddress ||
               !!error ||
               !bankDetails?.accountNumber ||
               bankDetails.accountNumber.length < 10 ||
               isEditingAccount ||
               isEstimating,
            loading: transactionStatus === "pending",
         };
      }

      return {
         text: isEstimating ? "Estimating..." : "Preparing...",
         handler: () => {},
         disabled: true,
         loading: isEstimating,
      };
   };

   // Handle transaction success
   useEffect(() => {
      if (isTxSuccess && txHash && swapStep === "swap") {
         logger.log(
            "TRANSACTION",
            `Transaction confirmed on blockchain: ${txHash}`
         );
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
      setAccountNumberInput(bankDetails?.accountNumber || "");
   }, [bankDetails]);

   // Fixed: Reset state when modal opens and estimate USDC
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
         setOfframpOrderId(null);
         setOfframpProgress(null);
         setIsPollingActive(false);
         setShowTwitterShare(false);

         setAccountNumberInput(bankDetails?.accountNumber || "");

         // Fixed: Check both Privy authentication AND Wagmi connection
         if (!authenticated) {
            setError("Please log in to continue.");
            return;
         }

         if (!isConnected || !walletAddress) {
            setError(
               "Wallet not connected. Please wait for wallet sync to complete."
            );
            return;
         }

         logger.log("MODAL", "Token to NGN confirmation modal opened", {
            swapDetails,
            authenticated,
            isConnected,
            walletAddress: walletAddress
               ? `${walletAddress.slice(0, 6)}...`
               : "none",
         });

         estimateUSDCOutput();
      }
   }, [
      isOpen,
      swapDetails,
      authenticated,
      isConnected,
      walletAddress,
      bankDetails,
   ]);

   if (!swapDetails) return null;

   // Animation variants
   const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
   };

   const modalVariants = {
      hidden: { scale: 0.95, opacity: 0 },
      visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
   };

   const stepVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
                        {swapStep === "complete"
                           ? "Swap Successful!"
                           : swapStep === "converting"
                           ? "Converting to NGN"
                           : "Confirm Token Swap"}
                     </h2>
                     <button
                        onClick={onClose}
                        disabled={
                           transactionStatus === "pending" ||
                           loadingDepositAddress ||
                           isPollingActive
                        }
                        className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50">
                        <X size={24} />
                     </button>
                  </div>

                  {/* Wallet Sync Status */}
                  <WalletSyncStatus />

                  {/* Only show the rest of the modal if wallet is properly connected */}
                  {authenticated && isConnected && walletAddress && (
                     <>
                        {/* Swap Details */}
                        <div className="flex items-center justify-between mb-5">
                           <div className="flex items-center gap-3">
                              {getTokenIcon(swapDetails.fromToken)}
                              <div>
                                 <p className="text-sm text-gray-400">From</p>
                                 <p className="font-semibold text-white">
                                    {swapDetails.fromAmount}{" "}
                                    {swapDetails.fromToken}
                                 </p>
                              </div>
                           </div>

                           <ArrowRight className="text-gray-400" size={24} />

                           <div className="flex items-center gap-3">
                              {getTokenIcon(swapDetails.toToken)}
                              <div className="text-right">
                                 <p className="text-sm text-gray-400">To</p>
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
                                 <RefreshCw
                                    className="text-yellow-500 mt-0.5"
                                    size={18}
                                 />
                                 <div>
                                    <p className="text-sm font-medium text-yellow-500">
                                       Estimated USDC Conversion
                                    </p>
                                    {isEstimating ? (
                                       <div className="flex items-center mt-2">
                                          <Loader
                                             className="animate-spin text-yellow-500 mr-2"
                                             size={16}
                                          />
                                          <p className="text-sm text-yellow-500">
                                             Calculating best rate...
                                          </p>
                                       </div>
                                    ) : estimatedUSDC ? (
                                       <div className="mt-2">
                                          <p className="text-sm text-yellow-400">
                                             Your {swapDetails.fromAmount}{" "}
                                             {swapDetails.fromToken} will first
                                             be converted to approximately{" "}
                                             <span className="font-bold">
                                                {estimatedUSDC} USDC
                                             </span>
                                          </p>
                                          <p className="text-xs text-yellow-500 mt-2">
                                             Minimum received (with 0.3%
                                             slippage): {minReceiveUSDC} USDC
                                          </p>
                                          <div className="flex items-start gap-1 mt-2 text-xs text-yellow-500">
                                             <AlertTriangle
                                                size={14}
                                                className="mt-0.5 flex-shrink-0"
                                             />
                                             <p className="italic">
                                                If the transaction fails, you'll
                                                be refunded this amount in USDC.
                                             </p>
                                          </div>
                                       </div>
                                    ) : (
                                       <p className="text-sm text-yellow-500 mt-2">
                                          Could not estimate USDC output. Please
                                          try again.
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
                                 <p className="text-sm font-medium text-gray-300">
                                    Transaction Progress
                                 </p>
                              </div>

                              <ProgressTracker />
                           </div>
                        )}

                        {/* NGN Conversion Progress */}
                        <NGNConversionProgress />

                        {/* Twitter Share Section */}
                        <TwitterShareSection />

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
                                    <span className="text-sm text-gray-400">
                                       Account Name
                                    </span>
                                    <span className="text-sm font-medium text-white">
                                       {bankDetails.accountName}
                                    </span>
                                 </div>
                                 <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-400">
                                       Bank Name
                                    </span>
                                    <span className="text-sm font-medium text-white">
                                       {bankDetails.bankName}
                                    </span>
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
                                          onClick={() =>
                                             setIsEditingAccount(true)
                                          }
                                          disabled={
                                             transactionStatus === "pending" ||
                                             isPollingActive
                                          }
                                          className="text-sm text-purple-400 hover:text-purple-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
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
                                             const value = e.target.value
                                                .replace(/\D/g, "")
                                                .substring(0, 10);
                                             setAccountNumberInput(value);
                                          }}
                                          placeholder="Enter your account number"
                                          className="w-full p-3 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                                       />
                                       <div className="flex gap-2">
                                          <button
                                             onClick={() => {
                                                setIsEditingAccount(false);
                                                setAccountNumberInput(
                                                   bankDetails.accountNumber ||
                                                      ""
                                                );
                                                setError(null);
                                             }}
                                             className="flex-1 px-4 py-2 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-700 transition-colors">
                                             Cancel
                                          </button>
                                          <button
                                             onClick={handleSaveAccountNumber}
                                             className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors">
                                             Save
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                       <div className="flex justify-between">
                                          <span className="text-sm text-gray-400">
                                             Account Number
                                          </span>
                                          <span className="text-sm font-medium text-white">
                                             {bankDetails.accountNumber ||
                                                "Not provided"}
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

                        {/* Success Message for Completed Conversion */}
                        {swapStep === "complete" && (
                           <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-green-900/20 rounded-lg p-4 mb-5 border border-green-900/50">
                              <div className="flex items-center gap-3 mb-3">
                                 <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
                                    <CheckCircle
                                       className="text-white"
                                       size={24}
                                    />
                                 </div>
                                 <div>
                                    <h3 className="text-lg font-semibold text-green-400">
                                       Conversion Complete!
                                    </h3>
                                    <p className="text-sm text-green-300">
                                       Your NGN has been sent to your bank
                                       account
                                    </p>
                                 </div>
                              </div>

                              {offrampProgress && (
                                 <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-green-900/30">
                                    <div>
                                       <p className="text-green-300">
                                          Final Amount
                                       </p>
                                       <p className="text-green-400 font-medium">
                                          ₦{swapDetails.toAmount}
                                       </p>
                                    </div>
                                    <div>
                                       <p className="text-green-300">
                                          Transaction Time
                                       </p>
                                       <p className="text-green-400 font-medium">
                                          {offrampProgress.lastUpdated
                                             ? new Date(
                                                  offrampProgress.lastUpdated
                                               ).toLocaleTimeString()
                                             : "Just now"}
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </motion.div>
                        )}

                        {/* Transaction Information */}
                        {swapStep !== "complete" &&
                           swapStep !== "converting" && (
                              <div className="bg-blue-900/20 rounded-lg p-4 mb-5 border border-blue-900/50">
                                 <div className="flex items-start gap-2">
                                    <Info
                                       className="text-blue-400 mt-0.5"
                                       size={18}
                                    />
                                    <div>
                                       <p className="text-sm text-blue-400">
                                          {swapDetails.fromToken === "ETH"
                                             ? "You'll be asked to confirm this transaction in your wallet. ETH will be directly used for the transaction."
                                             : needsApproval &&
                                               !isApprovalComplete
                                             ? "First, you'll need to approve the token for spending. Then you'll confirm the swap transaction."
                                             : "You'll be asked to confirm this transaction in your wallet. Once confirmed, your tokens will be swapped and converted to NGN."}
                                       </p>
                                       <p className="text-sm text-blue-400 mt-2 font-medium">
                                          The NGN conversion will happen
                                          automatically after the swap is
                                          complete.
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           )}

                        {/* Converting Information */}
                        {swapStep === "converting" && (
                           <div className="bg-indigo-900/20 rounded-lg p-4 mb-5 border border-indigo-900/50">
                              <div className="flex items-start gap-2">
                                 <CreditCard
                                    className="text-indigo-400 mt-0.5"
                                    size={18}
                                 />
                                 <div>
                                    <p className="text-sm text-indigo-400">
                                       Your tokens have been successfully
                                       swapped! We're now converting to NGN and
                                       sending to your bank account.
                                    </p>
                                    <p className="text-sm text-indigo-400 mt-2 font-medium">
                                       This process typically takes 2-5 minutes.
                                       You'll be notified once complete.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Error message if any */}
                        {error && (
                           <div className="bg-red-900/20 rounded-lg p-4 mb-5 border border-red-900/50">
                              <div className="flex items-start gap-2">
                                 <AlertCircle
                                    className="text-red-400 mt-0.5"
                                    size={18}
                                 />
                                 <p className="text-sm text-red-400">{error}</p>
                              </div>
                           </div>
                        )}

                        {/* Validation message if account number is missing */}
                        {(!bankDetails?.accountNumber ||
                           bankDetails.accountNumber.length < 10) &&
                           !isEditingAccount &&
                           swapStep !== "complete" && (
                              <div className="bg-yellow-900/20 rounded-lg p-4 mb-5 border border-yellow-900/50">
                                 <div className="flex items-start gap-2">
                                    <AlertTriangle
                                       className="text-yellow-500 mt-0.5"
                                       size={18}
                                    />
                                    <p className="text-sm text-yellow-500">
                                       Please enter a valid bank account number
                                       (minimum 10 digits) to receive the NGN
                                       payment.
                                    </p>
                                 </div>
                              </div>
                           )}

                        {/* Transaction status if waiting */}
                        {(loadingDepositAddress ||
                           transactionStatus === "pending" ||
                           transactionStatus === "success") && (
                           <motion.div
                              initial="hidden"
                              animate="visible"
                              variants={stepVariants}
                              className="bg-indigo-900/20 rounded-lg p-4 mb-5 border border-indigo-900/50">
                              <div className="flex items-center gap-2">
                                 {loadingDepositAddress ? (
                                    <>
                                       <Loader
                                          className="animate-spin text-indigo-400"
                                          size={18}
                                       />
                                       <p className="text-sm text-indigo-400">
                                          Fetching deposit address...
                                       </p>
                                    </>
                                 ) : transactionStatus === "pending" ? (
                                    <>
                                       <Loader
                                          className="animate-spin text-indigo-400"
                                          size={18}
                                       />
                                       <p className="text-sm text-indigo-400">
                                          {swapStep === "approval"
                                             ? "Approving tokens..."
                                             : "Transaction in progress..."}
                                       </p>
                                    </>
                                 ) : (
                                    <>
                                       <CheckCircle
                                          className="text-green-400"
                                          size={18}
                                       />
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
                                    Deposit Address:{" "}
                                    {truncateAddress(depositAddress)}
                                 </p>
                              )}
                           </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-6 sticky bottom-0 pb-2 pt-2 bg-gray-900">
                           <button
                              onClick={onClose}
                              disabled={
                                 transactionStatus === "pending" ||
                                 loadingDepositAddress ||
                                 isPollingActive
                              }
                              className="flex-1 px-4 py-3 border border-gray-600 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                              {swapStep === "complete"
                                 ? "Close"
                                 : swapStep === "converting"
                                 ? "Minimize"
                                 : "Cancel"}
                           </button>

                           {actionButton && (
                              <button
                                 onClick={actionButton.handler}
                                 disabled={actionButton.disabled}
                                 className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                 {actionButton.loading ? (
                                    <>
                                       <Loader
                                          className="animate-spin mr-2"
                                          size={16}
                                       />
                                       {actionButton.text}
                                    </>
                                 ) : (
                                    actionButton.text
                                 )}
                              </button>
                           )}

                           {/* Manual Status Check Button during conversion */}
                           {swapStep === "converting" && offrampOrderId && (
                              <button
                                 onClick={() =>
                                    checkOfframpStatus(offrampOrderId)
                                 }
                                 className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors flex items-center justify-center">
                                 <RefreshCw className="mr-2" size={16} />
                                 Check Status
                              </button>
                           )}
                        </div>
                     </>
                  )}
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default TokenToNGNConfirmModal;
