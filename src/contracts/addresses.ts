export const CONTRACT_ADDRESSES = {
   quoteContract: "0x998f0be3FA78a085374e49EcBF8E37703a4575A4",
};

import { supportedTokens } from "../constants/tokens";

export const TOKEN_ADDRESSES = {
   ETH: "ETH", // Special case for native token
   USDC: supportedTokens.USDC.address,
   USDT: supportedTokens.USDT.address,
   WETH: supportedTokens.WETH.address,
   ZORA: supportedTokens.ZORA.address,
   DEGEN: supportedTokens.DEGEN.address,
};
