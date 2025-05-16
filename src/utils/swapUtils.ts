import {
   Token,
   Currency,
   TokenSymbol,
   CurrencySymbol,
   SwapMode,
} from "../types/SwapTypes";
import { exchangeRates } from "../constants/swapConstants";

export const getImageUrl = (
   item: Token | Currency | undefined,
   imageKey: "icon" | "flag"
): string => {
   if (!item) return "";
   if (imageKey === "icon" && "icon" in item) {
      return item.icon;
   } else if (imageKey === "flag" && "flag" in item) {
      return item.flag;
   }
   return "";
};

export const getCurrentExchangeRate = (
   swapMode: SwapMode,
   selectedToken: TokenSymbol | null,
   selectedCurrency: CurrencySymbol | null
): number => {
   if (!selectedToken || !selectedCurrency) return 1;
   if (swapMode === "tokenToCurrency") {
      return exchangeRates[selectedToken]?.[selectedCurrency] || 1;
   } else {
      return exchangeRates[selectedCurrency]?.[selectedToken] || 1;
   }
};

export const calculateReceiveAmount = (
   amount: string,
   mode: SwapMode,
   selectedToken: TokenSymbol | null,
   selectedCurrency: CurrencySymbol | null
): string => {
   if (!amount || !selectedToken || !selectedCurrency) return "0";

   const numericAmount = parseFloat(amount);
   if (isNaN(numericAmount) || numericAmount === 0) return "0";

   // Skip the conversion for NGN<->USD, as it will be handled by the API
   if (selectedCurrency === "NGN") {
      // The API-based conversion will handle this
      // Return a placeholder that will be replaced
      return "0";
   }

   // For other currencies, use the existing logic
   if (mode === "tokenToCurrency") {
      const tokenRate = exchangeRates[selectedToken]?.[selectedCurrency] || 0;
      return (numericAmount * tokenRate).toFixed(2);
   } else {
      const currencyRate =
         exchangeRates[selectedCurrency]?.[selectedToken] || 0;
      return (numericAmount * currencyRate).toFixed(8);
   }
};

export const isSwapValid = (
   sendAmount: string,
   receiveAmount: string,
   selectedToken: TokenSymbol | null,
   selectedCurrency: CurrencySymbol | null
): boolean => {
   return !!(
      sendAmount &&
      receiveAmount &&
      selectedToken &&
      selectedCurrency &&
      parseFloat(sendAmount) > 0 &&
      parseFloat(receiveAmount) > 0
   );
};
