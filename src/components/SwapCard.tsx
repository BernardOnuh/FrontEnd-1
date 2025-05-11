import React, { useState, useEffect } from "react";
import { FaArrowDownLong } from "react-icons/fa6";
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
} from "../types/SwapTypes";
import {
   getCurrentExchangeRate,
   calculateReceiveAmount,
   isSwapValid,
} from "../utils/swapUtils";
import { fetchWalletBalances } from "../services/walletService";

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
   const [userTokenBalances, setUserTokenBalances] = useState<
      Record<string, string>
   >({});

   const { login, authenticated, user } = usePrivy();
   const navigate = useNavigate();

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
      setSelectedToken(symbol as TokenSymbol);
      setIsTokenSelectOpen(false);
      setSearchQuery("");
      updateReceiveAmount(sendAmount, symbol as TokenSymbol, selectedCurrency);
   };

   const handleCurrencySelect = (symbol: string) => {
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

   const handleConnect = async () => {
      try {
         if (!authenticated) {
            await login();
         }

         if (authenticated && user?.wallet?.address) {
            const balances = await fetchWalletBalances(user.wallet.address);
            setUserTokenBalances(balances);

            if (
               onSwapInitiate &&
               isSwapValid(
                  sendAmount,
                  receiveAmount,
                  selectedToken,
                  selectedCurrency
               )
            ) {
               // Type guard to ensure both values are not null
               if (selectedToken && selectedCurrency) {
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

                  onSwapInitiate(swapDetails);
               }
            } else {
               navigate("/app");
            }
         }
      } catch (error) {
         console.error("Privy login failed:", error);
      }
   };

   const getTokenBalance = (symbol: TokenSymbol | null): string => {
      if (!authenticated || !symbol) return "";
      return userTokenBalances[symbol] || "0.00";
   };

   const filteredTokens = tokens.filter(
      (token) =>
         token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         token.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   const filteredCurrencies = currencies.filter(
      (currency) =>
         currency.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         currency.name.toLowerCase().includes(searchQuery.toLowerCase())
   );

   // Initialize with defaults
   useEffect(() => {
      if (!selectedToken) setSelectedToken("ETH");
      if (!selectedCurrency) setSelectedCurrency("NGN");
   }, []);

   // Recalculate on token/currency selection change
   useEffect(() => {
      if (selectedToken && selectedCurrency && sendAmount) {
         updateReceiveAmount(sendAmount, selectedToken, selectedCurrency);
      }
   }, [selectedToken, selectedCurrency]);

   // Fetch wallet balances when authenticated
   useEffect(() => {
      const fetchBalances = async () => {
         if (authenticated && user?.wallet?.address) {
            const balances = await fetchWalletBalances(user.wallet.address);
            setUserTokenBalances(balances);
         }
      };
      fetchBalances();
   }, [authenticated, user?.wallet?.address]);

   // Determine what to show in each section based on swap mode
   const sendSection: SectionInfo =
      swapMode === "tokenToCurrency"
         ? {
              title: "Send",
              isToken: true,
              selectAction: () => setIsTokenSelectOpen(true),
              selected: selectedToken,
              items: tokens,
              findItem: (symbol) => tokens.find((t) => t.symbol === symbol),
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
              items: tokens,
              findItem: (symbol) => tokens.find((t) => t.symbol === symbol),
              imageKey: "icon",
           };

   return (
      <div className="w-full max-w-md mx-auto">
         <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-0.5 shadow-lg">
            <div className="bg-white rounded-3xl p-4 space-y-0">
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

               <div className="flex justify-center py-3 ">
                  <button
                     onClick={handleSwapDirection}
                     className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                     <FaArrowDownLong size={16} className="text-purple-500" />
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
                     disabled={
                        authenticated &&
                        !isSwapValid(
                           sendAmount,
                           receiveAmount,
                           selectedToken,
                           selectedCurrency
                        )
                     }
                     className={`w-full py-3 px-4 rounded-3xl font-semibold text-base transition-all ${
                        authenticated &&
                        !isSwapValid(
                           sendAmount,
                           receiveAmount,
                           selectedToken,
                           selectedCurrency
                        )
                           ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                           : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:opacity-90 shadow-md"
                     }`}>
                     {authenticated ? "Get started" : "Connect Wallet"}
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
