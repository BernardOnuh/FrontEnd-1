import { Token, Currency, ExchangeRates } from "../types/SwapTypes";

export const tokens: Token[] = [
   {
      symbol: "ETH",
      name: "Ethereum",
      balance: "1.23",
      icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg",
   },
   {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.0234",
      icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/btc.svg",
   },
   {
      symbol: "USDC",
      name: "USD Coin",
      balance: "1,005.43",
      icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg",
   },
   {
      symbol: "DAI",
      name: "Dai",
      balance: "750.21",
      icon: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/dai.svg",
   },
];

export const currencies: Currency[] = [
   {
      symbol: "NGN",
      name: "Naira",
      flag: "https://flagcdn.com/w40/ng.png",
   },
   {
      symbol: "GBP",
      name: "Pounds",
      flag: "https://flagcdn.com/w40/gb.png",
   },
   {
      symbol: "GHS",
      name: "Cedis",
      flag: "https://flagcdn.com/w40/gh.png",
   },
   {
      symbol: "USD",
      name: "Dollar",
      flag: "https://flagcdn.com/w40/us.png",
   },
];

export const exchangeRates: ExchangeRates = {
   // Token to Currency rates
   ETH: { NGN: 7500000, GBP: 3500, GHS: 68000, USD: 4500 },
   BTC: { NGN: 95000000, GBP: 46000, GHS: 840000, USD: 60000 },
   USDC: { NGN: 1595, GBP: 0.78, GHS: 14.5, USD: 1 },
   DAI: { NGN: 1590, GBP: 0.77, GHS: 14.3, USD: 0.99 },
   // Currency to Token rates (inverse of above with slight spread)
   NGN: { ETH: 0.00000013, BTC: 0.00000001, USDC: 0.00063, DAI: 0.00063 },
   GBP: { ETH: 0.00029, BTC: 0.000022, USDC: 1.28, DAI: 1.27 },
   GHS: { ETH: 0.000015, BTC: 0.0000012, USDC: 0.069, DAI: 0.068 },
   USD: { ETH: 0.00022, BTC: 0.000017, USDC: 1, DAI: 0.99 },
};
