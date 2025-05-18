import React, { useState, useEffect } from "react";
import { MdOutlineSwapVert } from "react-icons/md";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { SwapDetails } from "../context/SwapContext";
import SwapSection from "./SwapSection";
import SelectModal from "./SelectModal";
import { tokens, currencies } from "../constants/swapConstants";
import {
   TokenSymbol,
   CurrencySymbol,
   SectionInfo,
   SwapMode,
   Token,
} from "../types/SwapTypes";
import {
   getCurrentExchangeRate,
   calculateReceiveAmount,
   isSwapValid,
} from "../utils/swapUtils";
import { useTokenBalances } from "../hooks/useTokenBalance";
import { jwtDecode } from "jwt-decode"; // Add this import

// Add this interface
interface JwtPayload {
  exp: number;
  iat: number;
  userId: string;
  [key: string]: any;
}

interface SwapCardProps {
   onSwapInitiate?: (details: SwapDetails) => void;
}

const SwapCard: React.FC<SwapCardProps> = ({ onSwapInitiate }) => {
   const [sendAmount, setSendAmount] = useState("");
   const [receiveAmount, setReceiveAmount] = useState("");
   const [selectedToken, setSelectedToken] = useState<TokenSymbol | null>(null);
   const [selectedCurrency, setSelectedCurrency] =
      useState<CurrencySymbol | null>(null);
   const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
   const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [swapMode, setSwapMode] = useState<SwapMode>("tokenToCurrency");
   const [isLoading, setIsLoading] = useState(false);
   const [authToken, setAuthToken] = useState<string | null>(null);
   const [tokenRefreshTimer, setTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);

   const { login, authenticated, user } = usePrivy();
   const navigate = useNavigate();

   // Enhanced console logger with timestamp and category
   const logWithDetails = (category: string, message: string, data?: any) => {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${category}] ${message}`;
      
      if (data) {
         console.groupCollapsed(formattedMessage);
         console.log(data);
         console.groupEnd();
      } else {
         console.log(formattedMessage);
      }
   };

   // Token utility functions
   const isTokenExpired = (token: string): boolean => {
      try {
         const decoded = jwtDecode<JwtPayload>(token);
         const currentTime = Date.now() / 1000;
         return decoded.exp < currentTime;
      } catch (error) {
         // If we can't decode the token, consider it expired
         logWithDetails('ERROR', "Error decoding token, considering it expired", error);
         return true;
      }
   };

   const clearAuthData = () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenExpiry");
      // Keep walletAddress for reconnection
      setAuthToken(null);
      logWithDetails('AUTH', 'Auth data cleared');
   };

   // Create a map of token addresses and decimals
   const tokenConfigs = tokens.reduce((acc, token) => {
      acc[token.symbol] = {
         address: token.address,
         decimals: token.decimals,
      };
      return acc;
   }, {} as Record<string, { address: string; decimals: number }>);

   // Use the hook to fetch all token balances
   const { balances, isConnected } = useTokenBalances(tokenConfigs);

   const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (value === "" || /^\d*\.?\d*$/.test(value)) {
         setSendAmount(value);

         const calculatedAmount = calculateReceiveAmount(
            value,
            swapMode,
            selectedToken,
            selectedCurrency
         );
         setReceiveAmount(calculatedAmount);
      }
   };

   const handleTokenSelect = (symbol: string) => {
      logWithDetails('UI', `Token selected: ${symbol}`);
      setSelectedToken(symbol as TokenSymbol);
      setIsTokenSelectOpen(false);
      setSearchQuery("");
      updateReceiveAmount(sendAmount, symbol as TokenSymbol, selectedCurrency);
   };

   const handleCurrencySelect = (symbol: string) => {
      logWithDetails('UI', `Currency selected: ${symbol}`);
      setSelectedCurrency(symbol as CurrencySymbol);
      setIsCurrencySelectOpen(false);
      setSearchQuery("");
      updateReceiveAmount(sendAmount, selectedToken, symbol as CurrencySymbol);
   };

   const updateReceiveAmount = (
      amount: string,
      token: TokenSymbol | null,
      currency: CurrencySymbol | null
   ) => {
      const calculatedAmount = calculateReceiveAmount(
         amount,
         swapMode,
         token,
         currency
      );
      setReceiveAmount(calculatedAmount);
   };

   const handleSwapDirection = () => {
      const newMode: SwapMode =
         swapMode === "tokenToCurrency" ? "currencyToToken" : "tokenToCurrency";
      logWithDetails('UI', `Swap direction changed to: ${newMode}`);
      setSwapMode(newMode);

      if (receiveAmount && sendAmount) {
         setSendAmount(receiveAmount);

         const calculatedAmount = calculateReceiveAmount(
            receiveAmount,
            newMode,
            selectedToken,
            selectedCurrency
         );
         setReceiveAmount(calculatedAmount);
      }
   };

   // Enhanced authentication function with token expiration handling
   const authenticateUser = async (walletAddress: string, isRefresh = false): Promise<boolean> => {
      try {
         console.group('%c🔐 AUTHENTICATION PROCESS', 'color: #3b82f6; font-weight: bold; font-size: 12px;');
         logWithDetails('AUTH', `${isRefresh ? 'Refreshing' : 'Starting'} authentication process`);
         logWithDetails('AUTH', `Using wallet address: ${walletAddress}`);
         setIsLoading(true);
         
         // Start timer for performance tracking
         console.time('authApiCall');
         logWithDetails('API', 'Sending authentication request to API endpoint: https://aboki-api.onrender.com/api/ramp/auth/direct-auth');
         
         const response = await fetch("https://aboki-api.onrender.com/api/ramp/auth/direct-auth", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress }),
         });

         console.timeEnd('authApiCall');
         logWithDetails('API', `Auth API response status: ${response.status} ${response.statusText}`);
         
         // Clone the response for additional logging
         const responseClone = response.clone();
         // Log the full response headers
         const headers: Record<string, string> = {};
         responseClone.headers.forEach((value, key) => {
            headers[key] = value;
         });
         logWithDetails('API', 'Response headers:', headers);
         
         const data = await response.json();
         
         // Safely log the response data
         if (data.success && data.data && data.data.token) {
            const token = data.data.token;
            const firstFive = token.substring(0, 5);
            const lastFive = token.substring(token.length - 5);
            
            logWithDetails('AUTH', 'Authentication response:', {
               success: data.success,
               message: data.message,
               token: `${firstFive}...${lastFive}`,
               ramper: data.data.ramper ? {
                  id: data.data.ramper.id,
                  kycStatus: data.data.ramper.kycStatus,
                  kycMethod: data.data.ramper.kycMethod
               } : null
            });
            
            try {
               // Decode token to get expiration time
               const decoded = jwtDecode<JwtPayload>(token);
               const expiryTime = decoded.exp * 1000; // Convert to milliseconds
               
               // Store the token and expiry time
               localStorage.setItem("authToken", token);
               localStorage.setItem("tokenExpiry", expiryTime.toString());
               localStorage.setItem("walletAddress", walletAddress);
               
               logWithDetails('STORAGE', 'Credentials stored in localStorage', {
                  tokenStored: true,
                  walletAddressStored: true,
                  tokenExpiry: new Date(expiryTime).toISOString()
               });
               
               setAuthToken(token);
               
               // Clear any existing refresh timer
               if (tokenRefreshTimer) {
                  clearTimeout(tokenRefreshTimer);
               }
               
               // Set up a timer to refresh token before it expires
               const timeToExpiry = expiryTime - Date.now();
               const timeToRefresh = timeToExpiry - 300000; // Refresh 5 minutes before expiry
               
               if (timeToRefresh > 0) {
                  logWithDetails('AUTH', `Setting up token refresh in ${Math.floor(timeToRefresh/60000)} minutes`);
                  const timer = setTimeout(() => {
                     refreshAuthToken(walletAddress);
                  }, timeToRefresh);
                  setTokenRefreshTimer(timer);
               }
            } catch (error) {
               logWithDetails('ERROR', 'Failed to decode token expiry', error);
               // Still store the token even if we couldn't decode the expiry
               localStorage.setItem("authToken", token);
               localStorage.setItem("walletAddress", walletAddress);
               setAuthToken(token);
            }
            
            logWithDetails('AUTH', 'Authentication successful');
            console.groupEnd();
            return true;
         } else {
            logWithDetails('ERROR', `Authentication failed: ${data.message || "Unknown error"}`, data);
            console.error("Authentication failed:", data);
            console.groupEnd();
            return false;
         }
      } catch (error) {
         const errorMsg = error instanceof Error ? error.message : "Unknown error";
         logWithDetails('EXCEPTION', `Authentication error: ${errorMsg}`, error);
         console.error("Authentication error:", error);
         console.groupEnd();
         return false;
      } finally {
         setIsLoading(false);
      }
   };

   // Add this new function to refresh the auth token
   const refreshAuthToken = async (walletAddress: string): Promise<void> => {
      logWithDetails('AUTH', 'Refreshing authentication token');
      const success = await authenticateUser(walletAddress, true);
      
      if (!success) {
         logWithDetails('AUTH', 'Token refresh failed, clearing auth data');
         clearAuthData();
         // Optional: Show a notification to the user that they need to reconnect
      }
   };

   const isEligibleForSwap = (): boolean => {
      // Check if the swap mode is currency to token
      if (swapMode === "currencyToToken") {
         // Check if sending NGN and receiving ETH or USDC
         const isEligible = selectedCurrency === "NGN" &&
            parseFloat(sendAmount) > 0 &&
            (selectedToken === "ETH" || selectedToken === "USDC");
            
         return isEligible;
      }
      // For token to currency, we show "Coming Soon"
      return false;
   };

   const getButtonText = (): string => {
      if (!authenticated) {
         return "Connect Wallet";
      }

      if (!isSwapValid(sendAmount, receiveAmount, selectedToken, selectedCurrency)) {
         return "Enter amount";
      }

      if (isEligibleForSwap()) {
         return isLoading ? "Processing..." : "Swap";
      }

      return "Coming Soon";
   };

   const isButtonDisabled = (): boolean => {
      if (!authenticated) {
         return false; // Enable the button for wallet connection
      }

      if (!isSwapValid(sendAmount, receiveAmount, selectedToken, selectedCurrency)) {
         return true; // Disable if the swap is not valid
      }

      if (isEligibleForSwap()) {
         return isLoading; // Disable when loading during eligible swap
      }

      return true; // Disable for "Coming Soon"
   };

   // Enhanced connect handler with token expiration handling
   const handleConnect = async () => {
      try {
         if (!authenticated) {
            console.group('%c👋 WALLET CONNECTION', 'color: #f59e0b; font-weight: bold; font-size: 12px;');
            logWithDetails('AUTH', 'User not authenticated. Initiating Privy login...');
            await login();
            logWithDetails('AUTH', 'Privy login called');
            console.groupEnd();
            return;
         }

         console.group('%c🔄 SWAP INITIATION', 'color: #8b5cf6; font-weight: bold; font-size: 12px;');
         logWithDetails('ACTION', 'Authenticated user initiated swap');
         logWithDetails('CHECK', 'Checking swap eligibility', {
            swapMode,
            selectedToken,
            selectedCurrency,
            sendAmount,
            receiveAmount,
            isEligible: isEligibleForSwap()
         });
         
         if (
            isEligibleForSwap() &&
            isSwapValid(
               sendAmount,
               receiveAmount,
               selectedToken,
               selectedCurrency
            )
         ) {
            // Authenticate the user
            const walletAddress = user?.wallet?.address;
            if (!walletAddress) {
               logWithDetails('ERROR', 'Wallet address not found in user object');
               console.groupEnd();
               return;
            }

            logWithDetails('INFO', `Retrieved wallet address from user: ${walletAddress}`);
            
            // Check if we already have a token
            const existingToken = localStorage.getItem("authToken");
            
            // If token exists, check if it's expired
            if (existingToken) {
               if (isTokenExpired(existingToken)) {
                  logWithDetails('AUTH', 'Existing token is expired, refreshing');
                  const authSuccess = await authenticateUser(walletAddress);
                  
                  if (!authSuccess) {
                     logWithDetails('ERROR', 'Failed to refresh expired token');
                     console.groupEnd();
                     return;
                  }
               } else {
                  logWithDetails('AUTH', 'Using existing valid auth token from localStorage');
                  setAuthToken(existingToken);
               }
            } else {
               logWithDetails('AUTH', 'No existing token found, authenticating user...');
               const authSuccess = await authenticateUser(walletAddress);
               
               if (!authSuccess) {
                  logWithDetails('ERROR', 'Initial authentication failed');
                  console.groupEnd();
                  return;
               }
            }
            
            // Now proceed with the swap if authentication was successful
            if (authToken && onSwapInitiate && selectedToken && selectedCurrency) {
               logWithDetails('ACTION', 'Authentication successful, preparing swap details');
               const swapDetails: SwapDetails = {
                  fromToken:
                     swapMode === "tokenToCurrency"
                        ? selectedToken
                        : selectedCurrency,
                  toToken:
                     swapMode === "tokenToCurrency"
                        ? selectedCurrency
                        : selectedToken,
                  fromAmount: parseFloat(sendAmount),
                  toAmount: parseFloat(receiveAmount),
                  rate: getCurrentExchangeRate(
                     swapMode,
                     selectedToken,
                     selectedCurrency
                  ),
               };

               logWithDetails('ACTION', 'Swap details prepared', swapDetails);
               logWithDetails('ACTION', 'Calling onSwapInitiate callback');
               onSwapInitiate(swapDetails);
               logWithDetails('SUCCESS', 'Swap initiated successfully');
            } else {
               logWithDetails('ERROR', 'Authentication unsuccessful or missing swap parameters');
            }
         } else if (authenticated) {
            logWithDetails('INFO', 'User is authenticated but swap is not eligible or valid');
            navigate("/app");
         }
         
         console.groupEnd();
      } catch (error) {
         const errorMsg = error instanceof Error ? error.message : "Unknown error";
         console.error('%c❌ SWAP ERROR', 'color: #ef4444; font-weight: bold; font-size: 12px;', errorMsg, error);
         console.groupEnd();
      }
   };

   const getTokenBalance = (symbol: TokenSymbol | null): string => {
      if (!authenticated || !symbol || !balances[symbol]) return "0.00";

      const tokenBalance = balances[symbol].balance;
      return balances[symbol].isLoading ? "..." : tokenBalance;
   };

   // Update token objects with real-time balances
   const tokensWithBalances = tokens.map((token) => {
      return {
         ...token,
         balance: getTokenBalance(token.symbol as TokenSymbol),
      };
   });

   const filteredTokens = tokensWithBalances.filter(
      (token) =>
         token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         token.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const filteredCurrencies = currencies.filter(
      (currency) =>
         currency.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         currency.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   // Initialize with defaults and check token validity
   useEffect(() => {
      console.group('%c🔄 SWAP CARD INITIALIZATION', 'color: #10b981; font-weight: bold; font-size: 12px;');
      logWithDetails('LIFECYCLE', 'Component mounted');
      
      if (!selectedToken) {
         setSelectedToken("ETH");
         logWithDetails('CONFIG', 'Default token set to ETH');
      }
      if (!selectedCurrency) {
         setSelectedCurrency("NGN");
         logWithDetails('CONFIG', 'Default currency set to NGN');
      }
      
      // Check for existing auth token and validate it
      const storedToken = localStorage.getItem("authToken");
      
      if (storedToken) {
         // Check if token is expired
         if (isTokenExpired(storedToken)) {
            logWithDetails('AUTH', 'Stored token is expired, clearing it');
            clearAuthData();
         } else {
            logWithDetails('AUTH', 'Found valid auth token in localStorage');
            setAuthToken(storedToken);
            
            // Log token details (securely - just the first and last few characters)
            const firstFive = storedToken.substring(0, 5);
            const lastFive = storedToken.substring(storedToken.length - 5);
            logWithDetails('AUTH', `Token format: ${firstFive}...${lastFive}`);
            
            // Set up refresh timer if expiry time is available
            const tokenExpiry = localStorage.getItem("tokenExpiry");
            if (tokenExpiry) {
               const expiryTime = parseInt(tokenExpiry, 10);
               const timeToExpiry = expiryTime - Date.now();
               const timeToRefresh = timeToExpiry - 300000; // Refresh 5 minutes before expiry
               
               if (timeToRefresh > 0) {
                  logWithDetails('AUTH', `Setting up token refresh in ${Math.floor(timeToRefresh/60000)} minutes`);
                  const timer = setTimeout(() => {
                     const walletAddress = localStorage.getItem("walletAddress");
                     if (walletAddress) {
                        refreshAuthToken(walletAddress);
                     }
                  }, timeToRefresh);
                  setTokenRefreshTimer(timer);
               }
            }
         }
      } else {
         logWithDetails('AUTH', 'No auth token found in localStorage');
      }
      
      // Check for wallet address
      const storedWalletAddress = localStorage.getItem("walletAddress");
      if (storedWalletAddress) {
         logWithDetails('AUTH', `Found stored wallet address: ${storedWalletAddress}`);
      }
      
      console.groupEnd();
      
      // Cleanup function to clear timeout
      return () => {
         if (tokenRefreshTimer) {
            clearTimeout(tokenRefreshTimer);
         }
      };
   }, []);

   // When user authentication state changes
   useEffect(() => {
      if (authenticated) {
         logWithDetails('AUTH', 'User authenticated via Privy');
         if (user?.wallet?.address) {
            logWithDetails('AUTH', `User wallet address: ${user.wallet.address}`);
            
            // Check if token is expired or missing, and user just authenticated
            const storedToken = localStorage.getItem("authToken");
            if ((!storedToken || isTokenExpired(storedToken)) && user.wallet.address) {
               logWithDetails('AUTH', 'No valid token found but user is authenticated, getting new token');
               authenticateUser(user.wallet.address);
            }
         } else {
            logWithDetails('AUTH', 'User authenticated but wallet address not available');
         }
      }
   }, [authenticated, user]);

   // Recalculate on token/currency selection change
   useEffect(() => {
      if (selectedToken && selectedCurrency && sendAmount) {
         updateReceiveAmount(sendAmount, selectedToken, selectedCurrency);
      }
   }, [selectedToken, selectedCurrency]);

   // Determine what to show in each section based on swap mode
   const sendSection: SectionInfo =
      swapMode === "tokenToCurrency"
         ? {
              title: "Send",
              isToken: true,
              selectAction: () => setIsTokenSelectOpen(true),
              selected: selectedToken,
              items: tokensWithBalances,
              findItem: (symbol) =>
                 tokensWithBalances.find((t) => t.symbol === symbol),
              imageKey: "icon",
           }
         : {
              title: "Send",
              isToken: false,
              selectAction: () => setIsCurrencySelectOpen(true),
              selected: selectedCurrency,
              items: currencies,
              findItem: (symbol) => currencies.find((c) => c.symbol === symbol),
              imageKey: "flag",
           };

   const receiveSection: SectionInfo =
      swapMode === "tokenToCurrency"
         ? {
              title: "Receive",
              isToken: false,
              selectAction: () => setIsCurrencySelectOpen(true),
              selected: selectedCurrency,
              items: currencies,
              findItem: (symbol) => currencies.find((c) => c.symbol === symbol),
              imageKey: "flag",
           }
         : {
              title: "Receive",
              isToken: true,
              selectAction: () => setIsTokenSelectOpen(true),
              selected: selectedToken,
              items: tokensWithBalances,
              findItem: (symbol) =>
                 tokensWithBalances.find((t) => t.symbol === symbol),
              imageKey: "icon",
           };

   return (
      <div className="w-full max-w-md mx-auto">
         <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-0.5 shadow-lg">
            <div className="relative bg-white rounded-3xl p-4 space-y-0 grid gap-2">
               <SwapSection
                  sectionInfo={sendSection}
                  isInput={true}
                  sendAmount={sendAmount}
                  receiveAmount={receiveAmount}
                  onAmountChange={handleSendAmountChange}
                  selectedToken={selectedToken}
                  selectedCurrency={selectedCurrency}
                  swapMode={swapMode}
                  authenticated={authenticated}
                  getTokenBalance={getTokenBalance}
               />

               <div className="absolute left-1/2 top-[43%] transform -translate-x-1/2 -translate-y-1/2 flex justify-center py-3 ">
                  <button
                     onClick={handleSwapDirection}
                     className=" p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                     <MdOutlineSwapVert size={24} className="text-purple-500" />
                  </button>
               </div>

               <SwapSection
                  sectionInfo={receiveSection}
                  isInput={false}
                  sendAmount={sendAmount}
                  receiveAmount={receiveAmount}
                  selectedToken={selectedToken}
                  selectedCurrency={selectedCurrency}
                  swapMode={swapMode}
                  authenticated={authenticated}
                  getTokenBalance={getTokenBalance}
               />

               <div className="pt-3">
                  <button
                     onClick={handleConnect}
                     disabled={isButtonDisabled()}
                     className={`w-full py-3 px-4 rounded-3xl font-semibold text-base transition-all ${
                        isButtonDisabled()
                           ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                           : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:opacity-90 shadow-md"
                     }`}>
                     {getButtonText()}
                  </button>
               </div>
            </div>
         </div>

         <SelectModal
            isOpen={isTokenSelectOpen}
            onClose={() => {
               setIsTokenSelectOpen(false);
               setSearchQuery("");
            }}
            title="Select a token"
            items={filteredTokens}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onItemSelect={handleTokenSelect}
            isToken={true}
            authenticated={authenticated}
            getTokenBalance={getTokenBalance}
         />

         <SelectModal
            isOpen={isCurrencySelectOpen}
            onClose={() => {
               setIsCurrencySelectOpen(false);
               setSearchQuery("");
            }}
            title="Select a currency"
            items={filteredCurrencies}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onItemSelect={handleCurrencySelect}
            isToken={false}
         />
      </div>
   );
};

export default SwapCard;