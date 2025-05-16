// types/SwapTypes.ts
export type TokenSymbol =
   | "ETH"
   | "USDC"
   | "USDT"
   | "WETH"
   | "ZORA"
   | "DEGEN"
   | "cNGN";
export type CurrencySymbol = "NGN" | "KES" | "GBP" | "GHS" | "USD";

export interface Token {
   symbol: TokenSymbol;
   name: string;
   balance: string;
   icon: string;
   address: string; // Contract address
   decimals: number; // Token decimals
}

export interface Currency {
   symbol: CurrencySymbol;
   name: string;
   flag: string;
}

export interface ExchangeRates {
   [key: string]: {
      [key: string]: number;
   };
}

export type SwapMode = "tokenToCurrency" | "currencyToToken";

export interface SectionInfo {
   title: string;
   isToken: boolean;
   selectAction: () => void;
   selected: TokenSymbol | CurrencySymbol | null;
   items: Token[] | Currency[];
   findItem: (
      symbol: TokenSymbol | CurrencySymbol
   ) => Token | Currency | undefined;
   imageKey: "icon" | "flag";
}
