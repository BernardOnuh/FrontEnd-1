import React from "react";
import { ChevronDown } from "lucide-react";
import {
   SectionInfo,
   TokenSymbol,
   CurrencySymbol,
   SwapMode,
} from "../types/SwapTypes";
import { getImageUrl } from "../utils/swapUtils";
import { exchangeRates } from "../constants/swapConstants"; // Import exchange rates

interface SwapSectionProps {
   sectionInfo: SectionInfo;
   isInput: boolean;
   sendAmount: string;
   receiveAmount: string;
   onAmountChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
   selectedToken: TokenSymbol | null;
   selectedCurrency: CurrencySymbol | null;
   swapMode: SwapMode;
   authenticated: boolean;
   getTokenBalance: (symbol: TokenSymbol | null) => string;
   isBalanceLoading?: boolean; // New prop for loading state
}

const SwapSection: React.FC<SwapSectionProps> = ({
   sectionInfo,
   isInput,
   sendAmount,
   receiveAmount,
   onAmountChange,
   selectedToken,
   selectedCurrency,
   swapMode,
   authenticated,
   getTokenBalance,
   isBalanceLoading = false, // Default to false for backward compatibility
}) => {
   const sectionTitle = sectionInfo.title;
   const selected = sectionInfo.selected;
   const selectLabel = sectionInfo.isToken ? "Select token" : "Select currency";
   const selectedItem = selected ? sectionInfo.findItem(selected) : undefined;
   const imageUrl = getImageUrl(selectedItem, sectionInfo.imageKey);

   const getExchangeRateText = () => {
      if (!selectedToken || !selectedCurrency) return null;

      if (swapMode === "tokenToCurrency" && isInput && selected) {
         return `1 ${selected} ≈ ${
            exchangeRates[selected as TokenSymbol]?.[
               selectedCurrency
            ]?.toLocaleString() || "0"
         } ${selectedCurrency}`;
      } else if (swapMode === "currencyToToken" && isInput && selected) {
         return `1 ${selected} ≈ ${
            exchangeRates[selected as CurrencySymbol]?.[
               selectedToken
            ]?.toLocaleString() || "0"
         } ${selectedToken}`;
      } else if (swapMode === "tokenToCurrency" && !isInput && selected) {
         return `1 ${selected} ≈ ${(
            1 /
            (exchangeRates[selectedToken]?.[selected as CurrencySymbol] || 1)
         ).toFixed(8)} ${selectedToken}`;
      } else if (swapMode === "currencyToToken" && !isInput && selected) {
         return `1 ${selected} ≈ ${(
            1 /
            (exchangeRates[selected as CurrencySymbol]?.[selectedToken] || 1)
         ).toFixed(8)} ${selectedCurrency}`;
      }
      return null;
   };

   const calculateUSDValue = (
      amount: string,
      symbol: string | null,
      isToken: boolean
   ): string => {
      if (!amount || !symbol || parseFloat(amount) === 0) return "0.00";

      const numericAmount = parseFloat(amount);

      if (isToken) {
         // For tokens, get the USD rate directly
         const usdRate = exchangeRates[symbol]?.USD || 0;
         return (numericAmount * usdRate).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
         });
      } else {
         // For currencies, convert to USD
         if (symbol === "USD") return numericAmount.toFixed(2);

         // Convert currency to USD using token as intermediate
         // We'll use USDC as the intermediate since it's pegged to USD
         const currencyToUSDC = exchangeRates[symbol]?.USDC || 0;
         return (numericAmount * currencyToUSDC).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
         });
      }
   };

   const balanceValue =
      authenticated && sectionInfo.isToken && selected
         ? getTokenBalance(selected as TokenSymbol)
         : null;

   // Check if the balance is insufficient
   const isInsufficientBalance =
      isInput &&
      sectionInfo.isToken &&
      authenticated &&
      selected &&
      sendAmount &&
      parseFloat(sendAmount) > parseFloat(balanceValue || "0") &&
      !isBalanceLoading;

   return (
      <div className="bg-[#fafafa] rounded-2xl p-4 shadow-md">
         {/* Title and Balance Row */}
         <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 text-sm font-medium">
               {sectionTitle}
            </span>
            {sectionInfo.isToken && (
               <span className="text-xs text-gray-400">
                  {!authenticated
                     ? "Connect wallet to view balance"
                     : !selected
                     ? "Select token to view balance"
                     : isBalanceLoading
                     ? "Loading balance..."
                     : `Balance: ${balanceValue}`}
               </span>
            )}
         </div>

         {/* Amount Input/Display */}
         <div className="mb-3">
            {isInput ? (
               <input
                  type="text"
                  value={sendAmount}
                  onChange={onAmountChange}
                  className="w-full text-4xl font-light text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400"
                  placeholder="0"
               />
            ) : (
               <div className="text-4xl font-light text-gray-900">
                  {receiveAmount || "0"}
               </div>
            )}
         </div>

         {/* Token/Currency Selector */}
         <div className="flex items-center justify-between">
            {/* Exchange Rate Info */}
            <div className="text-xs text-gray-400">
               {sendAmount && selectedToken && selectedCurrency && (
                  <span>
                     {isInput
                        ? `$${calculateUSDValue(
                             sendAmount,
                             selected,
                             sectionInfo.isToken
                          )}`
                        : getExchangeRateText()}
                  </span>
               )}
            </div>

            {/* Select Button */}
            <button
               onClick={sectionInfo.selectAction}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all ${
                  selected
                     ? "bg-gray-100 hover:bg-gray-200"
                     : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
               }`}>
               {selected ? (
                  <>
                     <img
                        src={imageUrl}
                        alt={selected}
                        className="w-6 h-6 rounded-full"
                     />
                     <span className="font-medium text-gray-900">
                        {selected}
                     </span>
                     <ChevronDown size={16} className="text-gray-600" />
                  </>
               ) : (
                  <>
                     <span className="font-medium">{selectLabel}</span>
                     <ChevronDown size={16} />
                  </>
               )}
            </button>
         </div>

         {/* Warning for insufficient balance */}
         {isInsufficientBalance && (
            <div className="mt-2 text-xs text-red-500 font-medium">
               Insufficient balance
            </div>
         )}
      </div>
   );
};

export default SwapSection;
