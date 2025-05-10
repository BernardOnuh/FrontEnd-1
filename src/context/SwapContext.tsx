import { createContext } from "react";

export interface SwapDetails {
   fromToken: string;
   toToken: string;
   fromAmount: number;
   toAmount: number;
   rate: number;
}

export interface BankDetails {
   accountName: string;
   accountNumber: string;
   bankName: string;
   routingNumber: string;
   swiftCode?: string;
   bankAddress?: string;
   bankCountry: string;
   accountType: "savings" | "checking";
}

interface SwapContextType {
   swapDetails: SwapDetails | null;
   bankDetails: BankDetails | null;
}

export const SwapContext = createContext<SwapContextType>({
   swapDetails: null,
   bankDetails: null,
});
