// src/services/contractService.ts
import { parseUnits, formatUnits } from 'viem';

// Define a minimal ERC20 ABI 
const erc20Abi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "type": "function"
  }
];

// Gateway contract ABI and address
const GATEWAY_ADDRESS = "0x9e3F3908B9968d63164eDA5971C7499Ca4315fFC";
const GATEWAY_ABI =  [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_treasury",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_protocolFeePercent",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "refundAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "liquidityProvider",
        "type": "address"
      }
    ],
    "name": "OrderCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "liquidityProvider",
        "type": "address"
      }
    ],
    "name": "OrderFulfilled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "name": "OrderRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFeePercent",
        "type": "uint256"
      }
    ],
    "name": "ProtocolFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "uniswapRouter",
        "type": "address"
      }
    ],
    "name": "RouterUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "fromToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "toToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "name": "SwapExecuted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isSupported",
        "type": "bool"
      }
    ],
    "name": "TokenSupportUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "TreasuryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "weth",
        "type": "address"
      }
    ],
    "name": "WETHUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "WETH",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_rate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_refundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_liquidityProvider",
        "type": "address"
      }
    ],
    "name": "createOrder",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
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
      },
      {
        "internalType": "uint256",
        "name": "_minOutputAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_rate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_refundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_liquidityProvider",
        "type": "address"
      }
    ],
    "name": "createOrderWithCustomPath",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_targetToken",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_minOutputAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_rate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_refundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_liquidityProvider",
        "type": "address"
      }
    ],
    "name": "createOrderWithSwap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      }
    ],
    "name": "getOrderInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "refundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "liquidityProvider",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isFulfilled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isRefunded",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "orderIdCounter",
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
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "orders",
    "outputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rate",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "refundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "liquidityProvider",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isFulfilled",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isRefunded",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolFeePercent",
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
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_protocolFeePercent",
        "type": "uint256"
      }
    ],
    "name": "setProtocolFeePercent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isSupported",
        "type": "bool"
      }
    ],
    "name": "setTokenSupport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_treasury",
        "type": "address"
      }
    ],
    "name": "setTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_router",
        "type": "address"
      }
    ],
    "name": "setUniswapRouter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_weth",
        "type": "address"
      }
    ],
    "name": "setWETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "supportedTokens",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapRouter",
    "outputs": [
      {
        "internalType": "contract IUniswapV2Router02",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

const DEFAULT_SLIPPAGE = 0.5; // 0.5% slippage
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const cNGN_ADDRESS = "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const USDT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Special address for ETH

// Token paths definitions remain the same...
const TOKEN_PATHS = {
  "ETH": [ETH_ADDRESS, USDC_ADDRESS],
  "USDC": [USDC_ADDRESS],
  "WETH": [WETH_ADDRESS, USDC_ADDRESS],
  "USDT": [USDT_ADDRESS, WETH_ADDRESS, USDC_ADDRESS],
  "cNGN": [cNGN_ADDRESS, WETH_ADDRESS, USDC_ADDRESS],
  "ZORA": ["0x1111111111166b7FE7bd91427724B487980aFc69", WETH_ADDRESS, USDC_ADDRESS],
  "DEGEN": ["0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", WETH_ADDRESS, USDC_ADDRESS],
};

// Interfaces remain the same...
export interface SwapParams {
  token: string;
  tokenAddress: string;
  tokenDecimals: number;
  amount: string;
  minReceiveAmount: string;
  rate: number;
  walletAddress: string;
  liquidityProviderAddress: string;
}

export interface OfframpOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: string;
    depositAddress: string;
    totalAmount: number;
    feeAmount: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// Logger utility function - unchanged
export const logWithDetails = (category: string, message: string, data?: any) => {
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
 * Fetches deposit address from offramp API with improved error handling and detailed debug logging
 * UPDATED: Uses Swift code correctly as bankInstitutionName
 * @param authToken API authentication token
 * @param tokenSymbol Original token symbol (ETH, USDC, etc.)
 * @param amount Amount to swap in original token
 * @param estimatedUSDCAmount Estimated USDC output amount (used for all non-USDC tokens)
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
    console.group('%c🏦 FETCH DEPOSIT ADDRESS', 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.log(`Token: ${tokenSymbol}, Amount: ${amount}, EstimatedUSDC: ${estimatedUSDCAmount || 'N/A'}`);
    
    // First, deeply log the bank details for debugging
    console.log('Original Bank Details:');
    console.dir(bankDetails, { depth: null });
    
    // Validate auth token
    if (!authToken || authToken.trim() === '') {
      throw new Error("Missing authentication token. Please log in again.");
    }
    
    // For API, we always use USDC as the destination token for all swaps
    const apiTokenSymbol = "USDC";
    
    // Determine which amount to send to the API with extra safeguards
    let apiAmount: number;
    
    try {
      if (tokenSymbol === "USDC") {
        apiAmount = parseFloat(amount);
      } else if (estimatedUSDCAmount && tokenSymbol === "USDT") {
        // For USDT specifically, handle potential extreme conversion values
        const estimatedValue = parseFloat(estimatedUSDCAmount);
        
        // Check if the estimated value is unreasonably large (likely a conversion error)
        if (estimatedValue > 10000 && parseFloat(amount) < 1000) {
          console.warn(`Abnormally large USDT to USDC conversion detected: ${estimatedValue}`);
          // Use a reasonable estimate instead (e.g., 1:1 with small premium)
          apiAmount = parseFloat(amount) * 1.01;
          console.log(`Normalized to a reasonable amount: ${apiAmount}`);
        } else {
          apiAmount = estimatedValue;
        }
      } else if (estimatedUSDCAmount) {
        apiAmount = parseFloat(estimatedUSDCAmount);
      } else {
        apiAmount = parseFloat(amount);
      }
      
      // Force to fixed 2 decimal places to avoid floating point issues
      apiAmount = parseFloat(apiAmount.toFixed(2));
      
      console.log(`Calculated API amount: ${apiAmount} (${typeof apiAmount})`);
    } catch (error) {
      console.error("Error parsing amount:", error);
      throw new Error(`Invalid amount format: ${amount}. Please enter a valid number.`);
    }
    
    // Validate amount
    if (isNaN(apiAmount) || apiAmount <= 0) {
      throw new Error(`Invalid amount: ${apiAmount}. Please enter a valid positive amount.`);
    }
    
    // Detailed validation of bank details
    if (!bankDetails) {
      throw new Error("Bank details are missing. Please set up your bank account information.");
    }
    
    // CRITICAL UPDATE: Make sure we use the Swift code as bankInstitutionName
    // This ensures compatibility with the API requirements
    let bankInstitutionName = bankDetails.bankInstitutionName;
    
    // If routingNumber is provided and should be used as the Swift code
    if (bankDetails.routingNumber && !bankInstitutionName) {
      bankInstitutionName = bankDetails.routingNumber;
      console.log(`Using routingNumber as bankInstitutionName: ${bankInstitutionName}`);
    } else if (bankDetails.swiftCode && !bankInstitutionName) {
      bankInstitutionName = bankDetails.swiftCode;
      console.log(`Using swiftCode as bankInstitutionName: ${bankInstitutionName}`);
    }
    
    // Validate essential bank details
    if (!bankDetails.accountNumber) {
      throw new Error("Account number is required. Please provide a valid account number.");
    }
    
    if (!bankInstitutionName) {
      throw new Error("Bank institution code/Swift code is required. Please select a valid bank.");
    }
    
    if (!bankDetails.accountName) {
      throw new Error("Account name is required. Please verify your bank account.");
    }
    
    // Create properly formatted bank details object for the API
    const formattedBankDetails = {
      accountNumber: bankDetails.accountNumber,
      bankInstitutionName: bankInstitutionName, // Using Swift code or institution code
      accountName: bankDetails.accountName,
      memo: bankDetails.memo || "Token to NGN Swap"
    };
    
    console.log('Formatted Bank Details for API:');
    console.log({
      ...formattedBankDetails,
      accountNumber: `${formattedBankDetails.accountNumber.substring(0, 3)}...`
    });
    
    // Create request body with proper structure
    const requestBody = {
      amount: apiAmount,
      token: apiTokenSymbol,
      refundAddress: walletAddress,
      bankDetails: formattedBankDetails
    };
    
    // Log the exact request that will be sent to the API
    console.log("Request payload:", JSON.stringify(requestBody));
    
    try {
      // Set timeout for API call (20 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      console.log("Sending API request...");
      
      // Make the API call with timeout
      const response = await fetch("https://aboki-api.onrender.com/api/ramp/offramp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Log response status
      console.log(`Response received: ${response.status} ${response.statusText}`);
      
      // Read the response body
      const responseText = await response.text();
      console.log(`Response body (first 500 chars): ${responseText.substring(0, 500)}`);
      
      let data;
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
        console.log("Response parsed as JSON successfully");
        console.dir(data, { depth: null });
      } catch (e) {
        // If response is not JSON, log the raw text
        console.error("Failed to parse response as JSON:", e);
        console.log("Raw response text:");
        console.log(responseText);
        
        throw new Error(`Server returned invalid JSON response. Raw response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        // For 500 errors, log as much info as possible
        if (response.status >= 500) {
          console.error(`SERVER ERROR (${response.status}): The server encountered an internal error`);
          throw new Error(`Server error (500). This issue has been logged for debugging. Please try again later or contact support.`);
        }
        
        // Other non-500 errors
        throw new Error(`API error: ${data?.message || `Unknown error (status ${response.status})`}`);
      }

      // Check for successful response
      if (!data.success) {
        throw new Error(data.message || "The API reported failure despite a successful HTTP response");
      }
      
      // Extract deposit address from the correct location
      // Check both possible locations in the response
      let depositAddress;
      
      // First try to find in paycrest object as per the example response
      if (data.paycrest && data.paycrest.depositAddress) {
        depositAddress = data.paycrest.depositAddress;
        console.log("Found deposit address in paycrest object");
      } 
      // Fall back to the order object location
      else if (data.order && data.order.depositAddress) {
        depositAddress = data.order.depositAddress;
        console.log("Found deposit address in order object");
      } else {
        throw new Error("API response missing deposit address in expected locations");
      }
      
      // Check for valid Ethereum address format
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(depositAddress)) {
        throw new Error(`API returned invalid deposit address format: ${depositAddress.substring(0, 10)}...`);
      }
      
      // Success - store the order details and return the deposit address
      if (data.order && data.order.id) {
        localStorage.setItem("currentOrderId", data.order.id);
        localStorage.setItem("orderStatus", "PENDING");
        localStorage.setItem("orderTimestamp", new Date().toISOString());
      }
      
      console.log(`Successfully received deposit address: ${depositAddress.substring(0, 6)}...${depositAddress.substring(depositAddress.length - 4)}`);
      console.groupEnd();
      
      return depositAddress;
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error("Request timed out after 20 seconds");
          throw new Error("Request timed out after 20 seconds. The server may be experiencing high load. Please try again later.");
        }
        
        if (error.message.includes('fetch')) {
          console.error("Network error:", error);
          throw new Error("Network error. Please check your internet connection and try again.");
        }
      }
      
      // Rethrow the error
      console.error("API request error:", error);
      console.groupEnd();
      throw error;
    }
  } catch (error) {
    // Log error details
    console.error("Error in fetchOfframpDepositAddress:", error);
    console.groupEnd();
    
    // Rethrow with original message
    throw error;
  }
};

/**
 * Generates approval transaction parameters for an ERC20 token
 */
export const generateTokenApproval = (
  tokenAddress: string,
  tokenDecimals: number,
  amount: string,
  spenderAddress: string
) => {
  try {
    // Calculate amount in wei
    const amountInWei = parseUnits(amount, tokenDecimals);
    
    // Approval params
    return {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, amountInWei]
    };
  } catch (error) {
    logWithDetails('ERROR', 'Failed to generate approval params', error);
    throw error;
  }
};

/**
 * Checks if a token has enough allowance for the swap
 * FIXED: Proper use of readContract as an async function
 */
export const checkTokenAllowance = async (
  readContract: (params: any) => Promise<bigint>,  // Proper function type
  tokenAddress: string,
  tokenDecimals: number,
  walletAddress: string,
  amount: string,
  spenderAddress: string
) => {
  try {
    // Skip allowance check for native ETH
    if (tokenAddress === ETH_ADDRESS || tokenAddress.toLowerCase() === "eth") {
      return true;
    }
    
    const amountInWei = parseUnits(amount, tokenDecimals);
    
    // Check allowance - FIXED: proper async/await pattern
    const allowance = await readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [walletAddress as `0x${string}`, spenderAddress as `0x${string}`]
    });
    
    logWithDetails('CONTRACT', `Current allowance: ${formatUnits(allowance, tokenDecimals)}`);
    
    // Check if approval is needed
    return allowance >= amountInWei;
  } catch (error) {
    // FIXED: Better error handling with classification
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMsg.includes("user rejected")) {
      logWithDetails('ERROR', 'User rejected the request to check allowance', error);
      // Still return false to trigger approval flow
      return false;
    } else if (errorMsg.includes("network")) {
      logWithDetails('ERROR', 'Network error when checking allowance', error);
      throw new Error("Network error. Please check your internet connection and try again.");
    } else {
      logWithDetails('ERROR', 'Error checking token allowance', error);
      // Return false to trigger approval flow as a fallback
      return false;
    }
  }
};

/**
 * Generates parameters for a token-to-NGN swap based on token type
 */
export const generateSwapParams = (params: SwapParams) => {
  const { 
    token, 
    tokenAddress, 
    tokenDecimals, 
    amount, 
    minReceiveAmount, 
    rate, 
    walletAddress,
    liquidityProviderAddress
  } = params;
  
  try {
    // Calculate amounts
    const amountInWei = parseUnits(amount, tokenDecimals);
    // FIXED: Correct decimals for USDC (6) not cNGN
    const minOutputAmountInWei = parseUnits(minReceiveAmount, 6); // USDC has 6 decimals
    const rateInWei = parseUnits(rate.toString(), 18);
    const isNativeETH = token === "ETH" || tokenAddress === ETH_ADDRESS;
    
    logWithDetails('CONTRACT', 'Preparing swap parameters', {
      token,
      address: tokenAddress,
      amountInWei: amountInWei.toString(),
      minOutputAmount: minOutputAmountInWei.toString(),
      rate: rateInWei.toString(),
      walletAddress,
      liquidityProviderAddress,
      isNativeETH
    });
    
    // For tokens with direct path to USDC (primarily USDC itself)
    if (token === "USDC") {
      // For USDC, use the direct createOrder function
      return {
        address: GATEWAY_ADDRESS as `0x${string}`,
        abi: GATEWAY_ABI,
        functionName: 'createOrder',
        args: [
          tokenAddress as `0x${string}`,
          amountInWei,
          rateInWei,
          walletAddress as `0x${string}`,
          liquidityProviderAddress as `0x${string}`
        ]
      };
    } 
    // For native ETH, use createOrderWithSwap with value parameter
    else if (isNativeETH) {
      return {
        address: GATEWAY_ADDRESS as `0x${string}`,
        abi: GATEWAY_ABI,
        functionName: 'createOrderWithSwap',
        args: [
          USDC_ADDRESS as `0x${string}`,  // Target token (USDC)
          minOutputAmountInWei,
          rateInWei,
          walletAddress as `0x${string}`,  // Refund address
          liquidityProviderAddress as `0x${string}`  // Liquidity provider
        ],
        value: amountInWei // Send ETH with transaction
      };
    } 
    // For all other tokens (WETH, USDT, ZORA, DEGEN), use createOrderWithCustomPath with proper path
    else {
      const tokenPath = TOKEN_PATHS[token as keyof typeof TOKEN_PATHS];
      
      if (!tokenPath || tokenPath.length === 0) {
        throw new Error(`No swap path defined for token: ${token}`);
      }
      
      logWithDetails('CONTRACT', 'Using createOrderWithCustomPath with multi-hop path:', tokenPath);
      
      // FIXED: Ensure all addresses are properly formatted with 0x type
      const formattedPath = tokenPath.map(addr => addr as `0x${string}`);
      
      return {
        address: GATEWAY_ADDRESS as `0x${string}`,
        abi: GATEWAY_ABI,
        functionName: 'createOrderWithCustomPath',
        args: [
          formattedPath,
          amountInWei,
          minOutputAmountInWei,
          rateInWei,
          walletAddress as `0x${string}`,
          liquidityProviderAddress as `0x${string}`
        ]
      };
    }
  } catch (error) {
    logWithDetails('ERROR', 'Failed to generate swap parameters', error);
    throw error;
  }
};

/**
 * Calculates the minimum amount to receive with slippage
 */
export const calculateMinReceiveAmount = (
  receiveAmount: string,
  slippagePercent: number = DEFAULT_SLIPPAGE
): string => {
  if (!receiveAmount || receiveAmount === '0') return '0';
  
  const amount = parseFloat(receiveAmount);
  const slippage = slippagePercent / 100;
  const minAmount = amount * (1 - slippage);
  
  return minAmount.toFixed(2);
};

/**
 * Get token information from symbol
 */
export const getTokenInfo = (tokens: any[], symbol: string) => {
  const token = tokens.find(t => t.symbol === symbol);
  if (!token) {
    throw new Error(`Token ${symbol} not found`);
  }
  
  return {
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol
  };
};

/**
 * Handles a token-to-NGN swap from start to finish
 * FIXED: Properly typed readContract and writeContract functions
 */
export const executeTokenToNGNSwap = async (
  writeContract: (params: any) => Promise<`0x${string}`>, // Proper type for write function
  readContract: (params: any) => Promise<bigint>, // Proper type for read function
  params: {
    tokens: any[];
    selectedToken: string;
    sendAmount: string;
    receiveAmount: string;
    rate: number;
    walletAddress: string;
    authToken?: string;
    bankDetails?: any;
    estimatedUSDCAmount?: string | null; // Added estimated USDC amount
  }
) => {
  const { 
    tokens, 
    selectedToken, 
    sendAmount, 
    receiveAmount, 
    rate, 
    walletAddress,
    authToken,
    bankDetails,
    estimatedUSDCAmount
  } = params;
  
  try {
    console.group('%c🔄 TOKEN TO NGN SWAP', 'color: #8b5cf6; font-weight: bold; font-size: 12px;');
    
    // Get token info
    const token = getTokenInfo(tokens, selectedToken);
    logWithDetails('CONTRACT', `Processing swap for ${token.symbol}`, token);
    
    // Determine if this is native ETH
    const isNativeETH = token.symbol === "ETH" && (token.address === ETH_ADDRESS || token.address.toLowerCase() === "eth");
    
    // Get deposit address from offramp API
    let liquidityProviderAddress: string;
    if (authToken && bankDetails) {
      try {
        // Use updated function with estimated USDC amount
        liquidityProviderAddress = await fetchOfframpDepositAddress(
          authToken,
          token.symbol,
          sendAmount,
          estimatedUSDCAmount ?? null, // Ensure the value is either a string or null
          walletAddress,
          bankDetails
        );
      } catch (error) {
        logWithDetails('ERROR', 'Failed to fetch deposit address, using default', error);
        throw new Error('Failed to fetch deposit address from API. Please ensure bank details are valid.');
      }
    } else {
      throw new Error('Authentication token or bank details missing. Cannot proceed with swap.');
    }
    
    // For non-ETH tokens, check and handle approval
    if (!isNativeETH) {
      // FIXED: Properly use readContract as an async function
      const hasAllowance = await checkTokenAllowance(
        readContract,
        token.address,
        token.decimals,
        walletAddress,
        sendAmount,
        GATEWAY_ADDRESS
      );
      
      if (!hasAllowance) {
        logWithDetails('CONTRACT', 'Approval needed, requesting approval from user');
        
        // Generate approval parameters
        const approvalParams = generateTokenApproval(
          token.address,
          token.decimals,
          sendAmount,
          GATEWAY_ADDRESS
        );
        
        // Execute approval transaction
        // FIXED: Properly await the writeContract call
        const approvalTxHash = await writeContract(approvalParams);
        
        logWithDetails('CONTRACT', `Approval transaction submitted: ${approvalTxHash}`);
        return {
          success: false,
          requiresApproval: true,
          approvalTxHash,
          message: 'Token approval required before swap'
        };
      }
    }
    
    // Calculate min receive amount with slippage
    // For non-USDC tokens, use the estimated USDC with slippage
    // For USDC tokens, use the original receive amount
    let minReceiveAmount;
    if (selectedToken !== "USDC" && estimatedUSDCAmount) {
      minReceiveAmount = calculateMinReceiveAmount(estimatedUSDCAmount);
      logWithDetails('CONTRACT', `Using estimated USDC min amount with slippage: ${minReceiveAmount}`);
    } else {
      minReceiveAmount = calculateMinReceiveAmount(receiveAmount);
      logWithDetails('CONTRACT', `Using standard min amount with slippage: ${minReceiveAmount}`);
    }
    
    // Generate swap parameters
    const swapParams = generateSwapParams({
      token: token.symbol,
      tokenAddress: isNativeETH ? ETH_ADDRESS : token.address,
      tokenDecimals: token.decimals,
      amount: sendAmount,
      minReceiveAmount,
      rate,
      walletAddress,
      liquidityProviderAddress
    });
    
    logWithDetails('CONTRACT', 'Executing contract call with parameters:', {
      functionName: swapParams.functionName,
      args: swapParams.args,
      ...(swapParams.value !== undefined ? { value: swapParams.value } : {})
    });
    
    // Execute swap transaction
    // FIXED: Properly await the writeContract call
    const swapTxHash = await writeContract(swapParams);
    
    logWithDetails('CONTRACT', `Swap transaction submitted: ${swapTxHash}`);
    console.groupEnd();
    
    return {
      success: true,
      requiresApproval: false,
      swapTxHash,
      message: 'Swap transaction submitted successfully'
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logWithDetails('ERROR', `Smart contract swap error: ${errorMsg}`, error);
    console.groupEnd();
    
    // FIXED: Improved error classification and messaging
    let detailedError = errorMsg;
    
    // Extract more detailed error information
    if (error && typeof error === 'object' && 'cause' in error) {
      const cause = (error as any).cause;
      if (cause?.message) {
        detailedError = cause.message;
      }
    }
    
    // Classify common errors for better user feedback
    if (detailedError.includes("user rejected")) {
      return {
        success: false,
        requiresApproval: false,
        message: "Transaction was rejected in your wallet."
      };
    } else if (detailedError.includes("insufficient funds")) {
      return {
        success: false,
        requiresApproval: false,
        message: "Insufficient funds in your wallet to complete this transaction."
      };
    } else if (detailedError.includes("gas")) {
      return {
        success: false,
        requiresApproval: false,
        message: "Gas estimation failed. The network may be congested or your transaction may fail."
      };
    } else if (detailedError.includes("nonce")) {
      return {
        success: false,
        requiresApproval: false,
        message: "Transaction nonce error. Please refresh the page and try again."
      };
    } else {
      return {
        success: false,
        requiresApproval: false,
        message: `Swap failed: ${detailedError}`
      };
    }
  }
};
