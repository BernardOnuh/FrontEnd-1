export type TokenSymbol = "ETH" | "BTC" | "USDC" | "DAI";
export type CurrencySymbol = "NGN" | "GBP" | "GHS" | "USD";

export interface Token {
   symbol: TokenSymbol;
   name: string;
   balance: string;
   icon: string;
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
