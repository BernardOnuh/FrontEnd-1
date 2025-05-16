// hooks/useCurrencyConversion.ts
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { exchangeRates } from "../constants/swapConstants";

const API_BASE_URL = "https://aboki-api.onrender.com/api/conversion";
const CACHE_DURATION = 60 * 1000; // 1 minute cache
const DEBOUNCE_DELAY = 300; // 300ms debounce

// Type definitions for clarity
export type ConversionCurrency = "USD" | "NGN";

// Cache interface
interface CacheEntry {
   value: number;
   timestamp: number;
   rate: number;
}

interface ConversionResult {
   convertedAmount: string;
   formattedAmount: string;
   rate: number | null;
   loading: boolean;
   error: Error | null;
}

// Helper function to get expected rate range for validation
const getExpectedRateRange = (from: string, to: string): [number, number] => {
   // Get reference rate from existing exchange rates
   let referenceRate: number = 0;

   if (from === "USD" && to === "NGN") {
      referenceRate = exchangeRates.USDC?.NGN || 1595;
      // Allow 25% variation from reference rate
      return [referenceRate * 0.75, referenceRate * 1.25];
   } else if (from === "NGN" && to === "USD") {
      referenceRate = 1 / (exchangeRates.USDC?.NGN || 1595);
      return [referenceRate * 0.75, referenceRate * 1.25];
   }

   // Default 50% variation for other currencies
   return [0.5, 2.0];
};

// Simple cache implementation with direction awareness
const conversionCache: Record<string, CacheEntry> = {};

export function useCurrencyConversion(
   amount: string | number,
   fromCurrency: ConversionCurrency,
   toCurrency: ConversionCurrency,
   enabled: boolean = true
): ConversionResult {
   const [convertedAmount, setConvertedAmount] = useState<string>("0");
   const [formattedAmount, setFormattedAmount] = useState<string>("0");
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<Error | null>(null);
   const [rate, setRate] = useState<number | null>(null);

   // For debouncing
   const timerRef = useRef<NodeJS.Timeout | null>(null);

   // Skip conversion if amount is empty or zero, or if currencies are the same
   const shouldConvert =
      enabled &&
      !!amount &&
      parseFloat(String(amount)) > 0 &&
      fromCurrency !== toCurrency;

   // Format converted amount for display
   const formatAmount = (value: number): string => {
      return value.toLocaleString("en-US", {
         minimumFractionDigits: 2,
         maximumFractionDigits: 2,
      });
   };

   // Fallback to static rates if needed
   const useFallbackRate = (numericAmount: number) => {
      let fallbackRate = 0;

      if (fromCurrency === "USD" && toCurrency === "NGN") {
         fallbackRate = exchangeRates.USDC?.NGN || 1595;
      } else if (fromCurrency === "NGN" && toCurrency === "USD") {
         fallbackRate = 1 / (exchangeRates.USDC?.NGN || 1595);
      }

      if (fallbackRate > 0) {
         const result = numericAmount * fallbackRate;
         console.log(`Using fallback rate ${fallbackRate}`);
         setRate(fallbackRate);
         setConvertedAmount(result.toString());
         setFormattedAmount(formatAmount(result));
         return true;
      }

      return false;
   };

   // Convert between currencies using the API
   const fetchConversion = async (numericAmount: number) => {
      if (!shouldConvert) return;

      setLoading(true);
      setError(null);

      // Create cache key that's aware of conversion direction
      const cacheKey = `${numericAmount}_${fromCurrency}_${toCurrency}`;
      const cachedResult = conversionCache[cacheKey];

      if (
         cachedResult &&
         Date.now() - cachedResult.timestamp < CACHE_DURATION
      ) {
         console.log(`Using cached conversion: rate ${cachedResult.rate}`);
         setConvertedAmount(cachedResult.value.toString());
         setFormattedAmount(formatAmount(cachedResult.value));
         setRate(cachedResult.rate);
         setLoading(false);
         return;
      }

      try {
         // Get the exchange rate from the API
         console.log(
            `Fetching ${fromCurrency}->${toCurrency} rate for ${numericAmount}`
         );

         const response = await axios.get(`${API_BASE_URL}/rate`, {
            params: {
               from: fromCurrency,
               to: toCurrency,
            },
            headers: {
               // Add bearer token if needed for production
               // 'Authorization': `Bearer ${token}`,
            },
         });

         // Extract the conversion rate from API
         const apiRate = response.data.rate;
         console.log(
            `API returned ${fromCurrency}->${toCurrency} rate: ${apiRate}`
         );

         // Validate rate against expected range
         const [minExpected, maxExpected] = getExpectedRateRange(
            fromCurrency,
            toCurrency
         );
         let finalRate = apiRate;

         // If rate seems off, check if inverting it makes more sense
         if (apiRate < minExpected || apiRate > maxExpected) {
            const invertedRate = 1 / apiRate;

            if (invertedRate >= minExpected && invertedRate <= maxExpected) {
               console.log(
                  `API returned inverted rate. Correcting ${apiRate} to ${invertedRate}`
               );
               finalRate = invertedRate;
            } else {
               console.warn(
                  `API rate ${apiRate} outside expected range [${minExpected}, ${maxExpected}] - using anyway`
               );
            }
         }

         // Calculate the result using the validated rate
         const result = numericAmount * finalRate;

         // Update cache
         conversionCache[cacheKey] = {
            value: result,
            rate: finalRate,
            timestamp: Date.now(),
         };

         // Set both raw and formatted values
         setRate(finalRate);
         setConvertedAmount(result.toString());
         setFormattedAmount(formatAmount(result));

         console.log(
            `Conversion result: ${numericAmount} ${fromCurrency} = ${formatAmount(
               result
            )} ${toCurrency}`
         );
      } catch (err) {
         console.error(
            `Error converting ${fromCurrency} to ${toCurrency}:`,
            err
         );
         setError(err as Error);

         // Try to use fallback rate
         if (!useFallbackRate(numericAmount)) {
            setConvertedAmount("0");
            setFormattedAmount("Error");
         }
      } finally {
         setLoading(false);
      }
   };

   // Debounced fetch function
   const debouncedFetch = (amount: number) => {
      // Clear any existing timer
      if (timerRef.current) {
         clearTimeout(timerRef.current);
      }

      // Set a new timer
      timerRef.current = setTimeout(() => {
         fetchConversion(amount);
      }, DEBOUNCE_DELAY);
   };

   // Effect to trigger conversion when inputs change
   useEffect(() => {
      if (!shouldConvert) {
         setConvertedAmount("0");
         setFormattedAmount("0");
         return;
      }

      const numericAmount = parseFloat(String(amount));
      debouncedFetch(numericAmount);

      // Cleanup function
      return () => {
         if (timerRef.current) {
            clearTimeout(timerRef.current);
         }
      };
   }, [amount, fromCurrency, toCurrency, shouldConvert]);

   return {
      convertedAmount,
      formattedAmount,
      rate,
      loading,
      error,
   };
}
