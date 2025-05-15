// src/contracts/hooks/useQuoteContract.ts
import { useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useState, useEffect } from "react";
import QuoteContractABI from "../abis/QuoteContract.json";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "../addresses";

// Cache to store recent quotes (simple in-memory cache)
const quoteCache: Record<string, { value: string; timestamp: number }> = {};
const CACHE_EXPIRY = 30000; // 30 seconds

// Tokens that have direct USDC pairs (this may need adjusting based on your DEX liquidity)
const DIRECT_USDC_PAIRS = ["USDC", "USDT", "WETH", "ETH"];

export function useTokenQuote(amountIn: string, tokenSymbol: string | null) {
   const [quoteResult, setQuoteResult] = useState({
      quote: "0",
      quoteInUSD: 0,
      isLoading: false,
      isError: false,
      source: "loading" as "direct" | "path" | "cache" | "loading" | "error",
   });

   // Skip the query if amount is empty or zero or token is not selected
   const enabled = !!amountIn && parseFloat(amountIn) > 0 && !!tokenSymbol;

   // Get token address from symbol
   const tokenInAddress = tokenSymbol
      ? TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES]
      : null;
   // USDC is our quote token (for USD value)
   const tokenOutAddress = TOKEN_ADDRESSES.USDC;

   // Handle ETH as WETH for contract interactions
   const actualTokenInAddress =
      tokenInAddress === "ETH"
         ? TOKEN_ADDRESSES.WETH // Use WETH address when input is ETH
         : tokenInAddress;

   // Determine if we should use direct or path-based quote
   const needsPath = !DIRECT_USDC_PAIRS.includes(tokenSymbol || "");

   // Get token decimals
   const tokenInDecimals =
      tokenSymbol === "USDC" || tokenSymbol === "USDT" ? 6 : 18;

   // Check cache first for recent quotes
   const cacheKey = `${amountIn}-${tokenSymbol}-USDC`;
   const cachedQuote = quoteCache[cacheKey];
   const isCacheValid =
      cachedQuote && Date.now() - cachedQuote.timestamp < CACHE_EXPIRY;

   // Format amount with proper decimals
   const formattedAmountIn =
      enabled && actualTokenInAddress
         ? parseUnits(amountIn, tokenInDecimals)
         : BigInt(0);

   // Create the path array for path-based quotes
   const swapPath = needsPath
      ? [actualTokenInAddress as string, TOKEN_ADDRESSES.WETH, tokenOutAddress]
      : undefined;

   // Direct swap quote call
   const {
      data: directData,
      isError: directIsError,
      isPending: directIsPending,
   } = useReadContract({
      address: CONTRACT_ADDRESSES.quoteContract as `0x${string}`,
      abi: QuoteContractABI,
      functionName: "estimateSwapOutput",
      args: [
         actualTokenInAddress as `0x${string}`,
         tokenOutAddress,
         formattedAmountIn,
      ],
      query: {
         enabled: enabled && !needsPath && !isCacheValid,
         retry: 1,
      },
   });

   // Path-based swap quote call
   const {
      data: pathData,
      isError: pathIsError,
      isPending: pathIsPending,
   } = useReadContract({
      address: CONTRACT_ADDRESSES.quoteContract as `0x${string}`,
      abi: QuoteContractABI,
      functionName: "estimateSwapOutputWithPath",
      args: [swapPath as `0x${string}`[], formattedAmountIn],
      query: {
         enabled: enabled && needsPath && !isCacheValid,
         retry: 1,
      },
   });

   // Effect to update result based on direct or path-based call
   useEffect(() => {
      if (!enabled) {
         setQuoteResult({
            quote: "0",
            quoteInUSD: 0,
            isLoading: false,
            isError: false,
            source: "loading",
         });
         return;
      }

      // Use cache if valid
      if (isCacheValid) {
         setQuoteResult({
            quote: cachedQuote.value,
            quoteInUSD: parseFloat(cachedQuote.value),
            isLoading: false,
            isError: false,
            source: "cache",
         });
         return;
      }

      // Set loading state
      if ((needsPath && pathIsPending) || (!needsPath && directIsPending)) {
         setQuoteResult((prev) => ({
            ...prev,
            isLoading: true,
            source: "loading",
         }));
         return;
      }

      // Handle results based on whether we're using direct or path-based quote
      if (needsPath) {
         if (pathIsError) {
            console.error("Path-based quote failed:", pathIsError);
            setQuoteResult({
               quote: "0",
               quoteInUSD: 0,
               isLoading: false,
               isError: true,
               source: "error",
            });
         } else if (pathData) {
            const formattedQuote = formatUnits(pathData as bigint, 6); // USDC has 6 decimals
            console.log("Path-based quote:", formattedQuote);

            // Update cache
            quoteCache[cacheKey] = {
               value: formattedQuote,
               timestamp: Date.now(),
            };

            setQuoteResult({
               quote: formattedQuote,
               quoteInUSD: parseFloat(formattedQuote),
               isLoading: false,
               isError: false,
               source: "path",
            });
         }
      } else {
         if (directIsError) {
            console.error("Direct quote failed:", directIsError);
            setQuoteResult({
               quote: "0",
               quoteInUSD: 0,
               isLoading: false,
               isError: true,
               source: "error",
            });
         } else if (directData) {
            const formattedQuote = formatUnits(directData as bigint, 6); // USDC has 6 decimals
            console.log("Direct quote:", formattedQuote);

            // Update cache
            quoteCache[cacheKey] = {
               value: formattedQuote,
               timestamp: Date.now(),
            };

            setQuoteResult({
               quote: formattedQuote,
               quoteInUSD: parseFloat(formattedQuote),
               isLoading: false,
               isError: false,
               source: "direct",
            });
         }
      }
   }, [
      enabled,
      needsPath,
      directData,
      pathData,
      directIsError,
      pathIsError,
      directIsPending,
      pathIsPending,
      isCacheValid,
      cachedQuote,
   ]);

   // Debug logs
   useEffect(() => {
      console.log("Quote params:", {
         amountIn,
         tokenSymbol,
         formattedAmountIn: formattedAmountIn.toString(),
         needsPath,
         swapPath,
         contractAddress: CONTRACT_ADDRESSES.quoteContract,
         quoteResult,
      });
   }, [amountIn, tokenSymbol, formattedAmountIn, needsPath, quoteResult]);

   return quoteResult;
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
