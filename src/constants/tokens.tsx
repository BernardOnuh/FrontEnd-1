// src/constants/tokens.ts

export const supportedTokens = {
   USDC: {
     name: "USDC",
     address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
     decimals: 6,
     symbol: "USDC",
   },
   USDT: {
     name: "USDT",
     address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
     decimals: 6,
     symbol: "USDT",
   },
   ZORA: {
     name: "ZORA",
     address: "0x1111111111166b7FE7bd91427724B487980aFc69",
     decimals: 18,
     symbol: "ZORA",
   },
   DEGEN: {
     name: "DEGEN",
     address: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed",
     decimals: 18,
     symbol: "DEGEN",
   },
   cNGN: {
     name: "cNGN",
     address: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F",
     decimals: 18,
     symbol: "cNGN",
   },
   WETH: {
     name: "Wrapped ETH",
     address: "0x4200000000000000000000000000000000000006",
     decimals: 18,
     symbol: "WETH",
   },
 };
 
 // For convenience, create a map of token addresses to symbols
 export const tokenAddressToSymbol: Record<string, string> = {};
 
 // Populate the address mapping
 Object.entries(supportedTokens).forEach(([symbol, token]) => {
   tokenAddressToSymbol[token.address.toLowerCase()] = symbol;
 });
 
 // This special ETH placeholder address is used in many contracts
 export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
 tokenAddressToSymbol[ETH_ADDRESS.toLowerCase()] = "ETH";
 
 // Token icons for display
 export const tokenIcons = {
   ETH: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg",
   USDC: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdc.svg",
   USDT: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/usdt.svg",
   WETH: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/eth.svg",
   ZORA: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/generic.svg",
   DEGEN: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/generic.svg",
   cNGN: "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons/svg/color/generic.svg",
   NGN: "https://flagcdn.com/w40/ng.png", // Nigerian flag
   KES: "https://flagcdn.com/w40/ke.png", // Kenyan flag
   GHS: "https://flagcdn.com/w40/gh.png", // Ghanaian flag
   USD: "https://flagcdn.com/w40/us.png", // USA flag
 };
 
 // Default gas settings for transactions
 export const defaultGasSettings = {
   // Gas price in gwei, null means use network estimation
   gasPrice: null,
   // Gas limit, null means estimate automatically
   gasLimit: null,
   // Priority fee in gwei for EIP-1559 transactions
   maxPriorityFeePerGas: 1.5,
   // Max fee per gas in gwei for EIP-1559 transactions
   maxFeePerGas: null,
 };