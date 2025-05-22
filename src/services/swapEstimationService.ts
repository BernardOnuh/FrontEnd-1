// src/services/swapEstimationService.ts
import { parseUnits, formatUnits } from 'viem';

// Gateway contract ABI (just the estimation functions)
const GATEWAY_ABI_ESTIMATION = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inputToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_targetToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_inputAmount",
        "type": "uint256"
      }
    ],
    "name": "estimateSwapOutput",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_path",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_inputAmount",
        "type": "uint256"
      }
    ],
    "name": "estimateSwapOutputWithPath",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Constants
const GATEWAY_ADDRESS = "0x9e3F3908B9968d63164eDA5971C7499Ca4315fFC";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const cNGN_ADDRESS = "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const USDT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Special address for ETH

// Updated token paths with correct routing including intermediate hops
const TOKEN_PATHS = {
  // For ETH, use WETH path for estimation 
  "ETH": [WETH_ADDRESS, USDC_ADDRESS],
  
  // Direct path for USDC
  "USDC": [USDC_ADDRESS],
  
  // For WETH, go through USDC (direct path)
  "WETH": [WETH_ADDRESS, USDC_ADDRESS],
  
  // For USDT, go through WETH to USDC (updated for multi-hop)
  "USDT": [USDT_ADDRESS, USDC_ADDRESS],
  
  // cNGN through WETH to USDC
  "cNGN": [cNGN_ADDRESS, WETH_ADDRESS, USDC_ADDRESS],
  
  // Other tokens with paths through WETH
  "ZORA": ["0x1111111111166b7FE7bd91427724B487980aFc69", WETH_ADDRESS, USDC_ADDRESS],
  "DEGEN": ["0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", WETH_ADDRESS, USDC_ADDRESS],
};

// Interface for estimation parameters - FIXED: Changed readContract to function type
export interface SwapEstimationParams {
  token: string;
  tokenAddress: string;
  tokenDecimals: number;
  amount: string;
  readContract: (params: any) => Promise<bigint>; // Correct typing for readContract
}

/**
 * Logger utility
 */
const logWithDetails = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${category}] ${message}`;
  
  if (data) {
    console.groupCollapsed(formattedMessage);
    console.log(data);
    console.groupEnd();
  } else {
    console.log(formattedMessage);
  }
};

/**
 * Estimates the USDC output for a token swap
 * @param params The swap estimation parameters
 * @returns The estimated USDC amount as a string with fixed decimal places
 */
// Fix for estimateSwapOutput in swapEstimationService.ts
export const estimateSwapOutput = async (params: SwapEstimationParams): Promise<string> => {
    const { token, tokenAddress, tokenDecimals, amount, readContract } = params;
    
    try {
      // Validate inputs
      if (!token) {
        throw new Error("Token symbol is required");
      }
      
      if (!tokenAddress) {
        throw new Error(`Token address not found for ${token}`);
      }
      
      if (typeof readContract !== 'function') {
        throw new Error("Read contract function is invalid or not provided");
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Amount must be greater than zero");
      }
      
      logWithDetails('ESTIMATION', `Estimating swap output for ${amount} ${token}`, params);
      
      // Calculate amount in wei
      const amountInWei = parseUnits(amount, tokenDecimals);
      
      let estimatedOutput: bigint;
      
      // USDC doesn't need to be swapped
      if (token === "USDC") {
        return amount; // Just return the same amount
      }
      
      // For ETH, use WETH route for estimation
      else if (token === "ETH") {
        try {
          // Make sure we're calling readContract correctly
          estimatedOutput = await readContract({
            address: GATEWAY_ADDRESS as `0x${string}`,
            abi: GATEWAY_ABI_ESTIMATION,
            functionName: 'estimateSwapOutputWithPath',
            args: [
              [WETH_ADDRESS as `0x${string}`, USDC_ADDRESS as `0x${string}`],
              amountInWei
            ]
          });
          
          logWithDetails('ESTIMATION', `Raw ETH to USDC estimation result: ${estimatedOutput.toString()}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          // Log more details for debugging
          logWithDetails('ERROR', `ETH to USDC estimation error details`, { error, errorMsg });
          
          if (errorMsg.includes("insufficient liquidity")) {
            throw new Error(`Insufficient liquidity for ${token} to USDC swap. Try a smaller amount.`);
          } else if (errorMsg.includes("execution reverted")) {
            throw new Error(`ETH to USDC estimation failed: Contract execution reverted`);
          } else {
            throw new Error(`ETH to USDC estimation failed: ${errorMsg}`);
          }
        }
      }
      // For all other tokens, use estimateSwapOutputWithPath with the appropriate multi-hop path
      else {
        const tokenPath = TOKEN_PATHS[token as keyof typeof TOKEN_PATHS];
        
        if (!tokenPath || tokenPath.length === 0) {
          throw new Error(`No swap path defined for token: ${token}`);
        }
        
        logWithDetails('ESTIMATION', `Using multi-hop path for ${token}:`, tokenPath);
        
        try {
          // Convert path addresses to 0x format
          const formattedPath = tokenPath.map(addr => addr as `0x${string}`);
          
          estimatedOutput = await readContract({
            address: GATEWAY_ADDRESS as `0x${string}`,
            abi: GATEWAY_ABI_ESTIMATION,
            functionName: 'estimateSwapOutputWithPath',
            args: [
              formattedPath,
              amountInWei
            ]
          });
          
          logWithDetails('ESTIMATION', `Raw ${token} to USDC estimation result: ${estimatedOutput.toString()}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          // Log more details for debugging
          logWithDetails('ERROR', `${token} to USDC estimation error details`, { error, errorMsg });
          
          if (errorMsg.includes("insufficient liquidity")) {
            throw new Error(`Insufficient liquidity in the pool for ${token} to USDC swap. Try a smaller amount.`);
          } else if (errorMsg.includes("execution reverted")) {
            throw new Error(`Contract execution reverted: Likely insufficient liquidity or price impact too high for ${token} to USDC swap`);
          } else if (errorMsg.includes("transaction underpriced")) {
            throw new Error(`Network may be congested. The estimation requires a higher gas price.`);
          } else if (errorMsg.includes("user rejected")) {
            throw new Error(`User rejected the transaction request. Please try again.`);
          } else {
            throw new Error(`${token} to USDC estimation failed: ${errorMsg}`);
          }
        }
      }
      
      // Format the estimated output in USDC (6 decimals)
      const formattedOutput = formatUnits(estimatedOutput, 6);
      logWithDetails('ESTIMATION', `Estimated ${token} to USDC output: ${formattedOutput}`);
      
      // Return with fixed decimal places for UI display
      return parseFloat(formattedOutput).toFixed(2);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logWithDetails('ERROR', `Estimation error: ${errorMsg}`, error);
      throw error; // Re-throw to let the caller handle
    }
  };
/**
 * Update the fetchOfframpDepositAddress function to properly handle ETH and estimated USDC
 * @param authToken API authentication token
 * @param tokenSymbol Token symbol (ETH, USDC, etc.)
 * @param amount Amount to swap
 * @param estimatedUSDCAmount Estimated USDC output amount after swap (for non-USDC tokens)
 * @param walletAddress User's wallet address
 * @param bankDetails User's bank details
 * @returns Deposit address from the API
 */
export const fetchOfframpDepositAddress = async (
  authToken: string,
  tokenSymbol: string,
  amount: string,
  estimatedUSDCAmount: string | null,
  walletAddress: string,
  bankDetails: any
): Promise<string> => {
  try {
    // Special handling for ETH - we need to pass it as WETH to the API
    // but keep ETH as the token symbol for the contract interaction
    const apiTokenSymbol = tokenSymbol === "ETH" ? "WETH" : tokenSymbol;
    
    logWithDetails('API', 'Fetching offramp deposit address', {
      tokenForAPI: apiTokenSymbol,
      originalToken: tokenSymbol,
      amount,
      estimatedUSDC: estimatedUSDCAmount,
      walletAddressPrefix: walletAddress.substring(0, 6)
    });
    
    const response = await fetch("https://aboki-api.onrender.com/api/ramp/offramp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        token: apiTokenSymbol, // Use WETH for API when token is ETH
        estimatedUSDCAmount: estimatedUSDCAmount ? parseFloat(estimatedUSDCAmount) : null, // Pass the estimated USDC amount
        refundAddress: walletAddress,
        bankDetails
      })
    });

    if (!response.ok) {
      // FIXED: More detailed error handling for API responses
      if (response.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      } else if (response.status === 400) {
        throw new Error("Invalid request parameters. Please check your bank details and try again.");
      } else if (response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      } else {
        throw new Error(`API responded with status: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.success || !data.order.depositAddress) {
      throw new Error(data.message || "Failed to get deposit address");
    }
    
    // Store the order ID for later status checks
    localStorage.setItem("currentOrderId", data.order.id);
    localStorage.setItem("orderStatus", "PENDING");
    
    logWithDetails('API', 'Received deposit address from offramp API', {
      orderId: data.order.id,
      depositAddress: `${data.order.depositAddress.substring(0, 6)}...${data.order.depositAddress.substring(data.order.depositAddress.length - 4)}`,
      totalAmount: data.order.totalAmount,
      feeAmount: data.order.feeAmount
    });
    
    return data.order.depositAddress;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logWithDetails('ERROR', `Failed to fetch deposit address: ${errorMsg}`, error);
    throw error;
  }
};