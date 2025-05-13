import { ethers } from "ethers";
import { LiquidityPosition, PositionStatus } from "../types/LiquidityTypes";

// Function to validate Ethereum address
export const isValidEthAddress = (address: string): boolean => {
   try {
      return ethers.isAddress(address);
   } catch (error) {
      return false;
   }
};

// Function to shorten address for display
export const shortenAddress = (address: string, chars = 4): string => {
   if (!address) return "";
   return `${address.substring(0, chars + 2)}...${address.substring(
      address.length - chars
   )}`;
};

// Function to validate bank account number
export const isValidAccountNumber = (accountNumber: string): boolean => {
   // Nigerian account numbers are 10 digits
   return /^[0-9]{10}$/.test(accountNumber);
};

// Function to validate BVN and NIN
export const isValidIdNumber = (
   idType: "BVN" | "NIN",
   idNumber: string
): boolean => {
   // Both BVN and NIN are 11 digits in Nigeria
   return /^[0-9]{11}$/.test(idNumber);
};

// Calculate expected returns based on amount and APR
export const calculateExpectedReturns = (
   amount: number,
   apr: number,
   days: number
): number => {
   // Calculate daily rate
   const dailyRate = apr / 365 / 100;

   // Calculate expected returns
   return amount * dailyRate * days;
};

// Get position status color
export const getStatusColor = (status: PositionStatus): string => {
   switch (status) {
      case "ACTIVE":
         return "green";
      case "PAUSED":
         return "yellow";
      case "COMPLETED":
         return "gray";
      default:
         return "gray";
   }
};

// Sort positions by date
export const sortPositionsByDate = (
   positions: LiquidityPosition[],
   ascending = false
): LiquidityPosition[] => {
   return [...positions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return ascending ? dateA - dateB : dateB - dateA;
   });
};

// Filter positions by type
export const filterPositionsByType = (
   positions: LiquidityPosition[],
   type: "crypto" | "fiat" | "all"
): LiquidityPosition[] => {
   if (type === "all") return positions;

   return positions.filter((position) => {
      if (type === "crypto") {
         return position.role === "CRYPTO_TO_FIAT";
      } else {
         return position.role === "FIAT_TO_CRYPTO";
      }
   });
};

// Function to format currency
export const formatCurrency = (amount: number, currency: string): string => {
   if (currency === "USDC") {
      return `${amount.toLocaleString()} USDC`;
   } else {
      return new Intl.NumberFormat("en-NG", {
         style: "currency",
         currency: currency,
      }).format(amount);
   }
};

// Generate mock transaction hash
export const generateMockTxHash = (): string => {
   return `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
   ).join("")}`;
};

export default {
   isValidEthAddress,
   shortenAddress,
   isValidAccountNumber,
   isValidIdNumber,
   calculateExpectedReturns,
   getStatusColor,
   sortPositionsByDate,
   filterPositionsByType,
   formatCurrency,
   generateMockTxHash,
};
