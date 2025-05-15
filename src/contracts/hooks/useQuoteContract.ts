// src/contracts/hooks/useQuoteContract.ts
import { useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import QuoteContractABI from "../abis/QuoteContract.json";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "../addresses";

// Cache to store recent quotes (simple in-memory cache)
const quoteCache: Record<string, { value: string; timestamp: number }> = {};
const CACHE_EXPIRY = 30000; // 30 seconds

export function useTokenQuote(amountIn: string, tokenSymbol: string | null) {
   // Skip the query if amount is empty or zero or token is not selected
   const enabled = !!amountIn && parseFloat(amountIn) > 0 && !!tokenSymbol;

   // Get token address from symbol
   const tokenInAddress = tokenSymbol
      ? TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES]
      : null;
   // USDC is our quote token (for USD value)
   const tokenOutAddress = TOKEN_ADDRESSES.USDC;

   // Get token decimals
   const tokenInDecimals =
      tokenSymbol === "USDC" || tokenSymbol === "USDT" ? 6 : 18;

   // Check cache first for recent quotes
   const cacheKey = `${amountIn}-${tokenSymbol}-USDC`;
   const cachedQuote = quoteCache[cacheKey];
   const isCacheValid =
      cachedQuote && Date.now() - cachedQuote.timestamp < CACHE_EXPIRY;

   // Only query if enabled and cache is invalid
   const shouldQuery = enabled && !isCacheValid && !!tokenInAddress;

   // Format amount with proper decimals
   const formattedAmountIn =
      enabled && tokenInAddress
         ? parseUnits(amountIn, tokenInDecimals)
         : BigInt(0);

   const { data, isError, isPending, refetch } = useReadContract({
      address: CONTRACT_ADDRESSES.quoteContract as `0x${string}`,
      abi: QuoteContractABI,
      functionName: "getQuote",
      args: [formattedAmountIn, tokenInAddress, tokenOutAddress],
      query: {
         enabled: shouldQuery,
      },
   });

   // Format the returned quote to a human-readable value
   let formattedQuote = "0";
   if (data) {
      formattedQuote = formatUnits(data as bigint, 6); // USDC has 6 decimals
      // Update cache
      quoteCache[cacheKey] = {
         value: formattedQuote,
         timestamp: Date.now(),
      };
   } else if (isCacheValid) {
      formattedQuote = cachedQuote.value;
   }

   // Return formatted values and status
   return {
      quote: formattedQuote,
      quoteInUSD: parseFloat(formattedQuote),
      isLoading: isPending,
      isError,
      refetch,
   };
}

// Helper function to format balance to avoid overflow
export function formatBalance(
   balance: string,
   maxDecimals: number = 6
): string {
   if (!balance || balance === "0" || balance === "0.00") return "0.00";

   const number = parseFloat(balance);
   if (isNaN(number)) return "0.00";

   // For very small numbers, show scientific notation
   if (number < 0.000001) return number.toExponential(4);

   // For other numbers, limit decimal places
   return number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
   });
}
