// src/hooks/useTokenSwap.ts
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from '@wagmi/core';
import { parseUnits } from 'viem';
import { gatewayAbi } from '../../contracts/abis/GatewayAbi';
import { erc20Abi } from 'viem';
import { logger } from '../../utils/swapUtils';
import { supportedTokens } from '../../constants/tokens';
import { estimateSwapOutput } from '../../services/swapEstimationService';
import { config } from '../../wagmiConfig'; // Import the wagmi config

// Gateway contract address
const GATEWAY_CONTRACT_ADDRESS = "0x9e3F3908B9968d63164eDA5971C7499Ca4315fFC";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Define interface for different swap function parameters
interface TokenOrderParams {
  tokenSymbol: string;
  tokenAmount: string;
  rate: number;
  targetCurrency: string;
  liquidityProviderAddress: string;
  estimatedUSDCAmount?: string | null; // Added for USDC estimation
  minOutputAmount?: string
}

interface PathOrderParams {
  tokenSymbol: string;
  tokenAmount: string;
  minOutputAmount: string;
  rate: number;
  targetCurrency: string;
  liquidityProviderAddress: string;
  path?: string[]; // Optional custom path
  estimatedUSDCAmount?: string | null; // Added for USDC estimation
}

// Mapping of token symbols to multi-hop paths
const TOKEN_PATHS = {
  // For ETH, use ETH->USDC path
  "ETH": [ETH_ADDRESS, USDC_ADDRESS],
  
  // Direct path for USDC
  "USDC": [USDC_ADDRESS],
  
  // For WETH, use direct path to USDC
  "WETH": [WETH_ADDRESS, USDC_ADDRESS],
  
  // For other tokens, go through WETH to USDC (multi-hop)
  "USDT": [supportedTokens.USDT?.address, USDC_ADDRESS],
  "ZORA": [supportedTokens.ZORA?.address, WETH_ADDRESS, USDC_ADDRESS],
  "DEGEN": [supportedTokens.DEGEN?.address, WETH_ADDRESS, USDC_ADDRESS],
};

// Function to calculate minimum amount with slippage
const calculateMinAmount = (amount: string, slippagePercent: number = 0.2): string => {
  if (!amount || amount === '0') return '0';
  
  const parsedAmount = parseFloat(amount);
  const slippage = slippagePercent / 100;
  const minAmount = parsedAmount * (1 - slippage);
  
  return minAmount.toFixed(2);
};

export function useTokenSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedUSDC, setEstimatedUSDC] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  
  const { address: walletAddress } = useAccount();
  
  // Use writeContractAsync for write operations
  const { writeContractAsync } = useWriteContract();
  
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });
  
  /**
   * Estimates USDC output for a token swap
   * FIXED: Use readContract with wagmi config
   */
  const estimateUSDCForSwap = async (tokenSymbol: string, amountStr: string): Promise<string | null> => {
    try {
      setIsEstimating(true);
      
      // Get token config
      const tokenConfig = supportedTokens[tokenSymbol as keyof typeof supportedTokens];
      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not supported`);
      }
      
      // No need to estimate for USDC
      if (tokenSymbol === "USDC") {
        return amountStr;
      }
      
      // FIXED: Use wagmi config with readContract
      const output = await estimateSwapOutput({
        token: tokenSymbol,
        tokenAddress: tokenConfig.address,
        tokenDecimals: tokenConfig.decimals,
        amount: amountStr,
        readContract: async (params) => {
          try {
            // Use wagmi v2's readContract with proper config
            const result = await readContract(config, {
              address: params.address,
              abi: params.abi,
              functionName: params.functionName,
              args: params.args
            });
            
            // Cast the result to bigint explicitly
            return BigInt((result as bigint | string).toString());
          } catch (error) {
            console.error('Error reading contract:', error);
            throw error;
          }
        }
      });
      
      setEstimatedUSDC(output);
      logger.log('ESTIMATION', `Estimated USDC output for ${amountStr} ${tokenSymbol}: ${output}`);
      return output;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `USDC estimation error: ${errorMsg}`, error);
      
      // FIXED: Better error classification
      if (errorMsg.includes("insufficient liquidity")) {
        setError(`Insufficient liquidity for ${tokenSymbol} to USDC conversion. Try a smaller amount.`);
      } else if (errorMsg.includes("execution reverted")) {
        setError(`Estimation failed: the contract call reverted. This may be due to price impact or low liquidity.`);
      } else if (errorMsg.includes("network")) {
        setError("Network error when estimating. Please check your connection and try again.");
      } else {
        setError(`Estimation error: ${errorMsg}`);
      }
      
      return null;
    } finally {
      setIsEstimating(false);
    }
  };
  
  /**
   * Approves token spending for the Gateway contract
   * FIXED: Using single writeContractAsync
   */
  const approveTokenSpending = async (tokenSymbol: string, amountStr: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Get token config
      const tokenConfig = supportedTokens[tokenSymbol as keyof typeof supportedTokens];
      if (!tokenConfig) {
        throw new Error(`Token ${tokenSymbol} not supported`);
      }
      
      // Native ETH doesn't need approval
      if (tokenSymbol === 'ETH') {
        return true;
      }
      
      logger.log('TRANSACTION', `Approving ${tokenSymbol} for contract usage`);
      
      // Parse amount with proper decimals
      const approvalAmount = parseUnits("999999999", tokenConfig.decimals);
      
      const hash = await writeContractAsync({
        address: tokenConfig.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [GATEWAY_CONTRACT_ADDRESS as `0x${string}`, approvalAmount]
      });
      
      logger.log('TRANSACTION', `Approval transaction sent: ${hash}`);
      setTxHash(hash);
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Approval failed: ${errorMsg}`, error);
      
      // FIXED: Better error classification
      if (errorMsg.includes("user rejected")) {
        setError("Transaction was rejected in your wallet. Please try again.");
      } else if (errorMsg.includes("insufficient funds")) {
        setError("You have insufficient funds in your wallet to approve this token.");
      } else if (errorMsg.includes("network")) {
        setError("Network error when approving. Please check your connection and try again.");
      } else {
        setError(`Approval failed: ${errorMsg}`);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Creates a basic token swap order
   * FIXED: Using single writeContractAsync, better error handling
   */
  const createTokenOrder = async (params: TokenOrderParams): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Get token config
      const tokenConfig = supportedTokens[params.tokenSymbol as keyof typeof supportedTokens];
      if (!tokenConfig) {
        throw new Error(`Token ${params.tokenSymbol} not supported`);
      }
      
      logger.log('TRANSACTION', `Creating order for ${params.tokenAmount} ${params.tokenSymbol} to ${params.targetCurrency}`);
      
      // Parse amount with proper decimals
      const tokenAmount = parseUnits(params.tokenAmount, tokenConfig.decimals);
      
      // FIXED: Proper handling of rate decimals
      // Rate should be in the contract's expected format (18 decimals for most operations)
      const rateWithDecimals = parseUnits(params.rate.toString(), 18);
      
      // For USDC to NGN, use basic createOrder
      const hash = await writeContractAsync({
        address: GATEWAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: gatewayAbi,
        functionName: 'createOrder',
        args: [
          tokenConfig.address as `0x${string}`,
          tokenAmount,
          rateWithDecimals,
          walletAddress as `0x${string}`,
          params.liquidityProviderAddress as `0x${string}`
        ]
      });
      
      logger.log('TRANSACTION', `Order creation transaction sent: ${hash}`);
      setTxHash(hash);
      
      return hash;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Order creation failed: ${errorMsg}`, error);
      
      // FIXED: Better error classification
      if (errorMsg.includes("user rejected")) {
        setError("Transaction was rejected in your wallet. Please try again.");
      } else if (errorMsg.includes("insufficient funds")) {
        setError("You have insufficient funds in your wallet to complete this transaction.");
      } else if (errorMsg.includes("gas")) {
        setError("Gas estimation failed. Your transaction may fail or the network is congested.");
      } else if (errorMsg.includes("nonce")) {
        setError("Transaction nonce error. Please refresh the page and try again.");
      } else {
        setError(`Order creation failed: ${errorMsg}`);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Creates an order with swap (for ETH to USDC to NGN)
   * FIXED: Using single writeContractAsync, better error handling
   */
  const createOrderWithSwapAndConversion = async (params: TokenOrderParams): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      logger.log('TRANSACTION', `Creating swap order for ${params.tokenAmount} ${params.tokenSymbol} to ${params.targetCurrency}`);
      
      // For ETH we use a special address
      const USDC_CONFIG = supportedTokens.USDC;
      
      // Parse amount with proper decimals
      const tokenAmount = parseUnits(params.tokenAmount, 18); // ETH has 18 decimals
      
      // Use estimated USDC with slippage if available, or use a conservative estimate
      let minOutputAmount;
      if (params.estimatedUSDCAmount) {
        const minUSDC = calculateMinAmount(params.estimatedUSDCAmount, 0.5);
        minOutputAmount = parseUnits(minUSDC, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using estimated USDC min amount: ${minUSDC}`);
      } else if (params.minOutputAmount) {
        minOutputAmount = parseUnits(params.minOutputAmount, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using provided min output amount: ${params.minOutputAmount}`);
      } else {
        // FIXED: Use a more sensible default (0.01% of input) instead of zero
        const conservativeMin = (parseFloat(params.tokenAmount) * 0.0001).toFixed(USDC_CONFIG.decimals);
        minOutputAmount = parseUnits(conservativeMin, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using conservative min amount: ${conservativeMin} USDC`);
      }
      
      // FIXED: Proper handling of rate decimals (18 decimals)
      const rateWithDecimals = parseUnits(params.rate.toString(), 18);
      
      const hash = await writeContractAsync({
        address: GATEWAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: gatewayAbi,
        functionName: 'createOrderWithSwap',
        args: [
          USDC_ADDRESS as `0x${string}`, // Target token (USDC)
          minOutputAmount, // Use USDC min amount 
          rateWithDecimals,
          walletAddress as `0x${string}`, // Refund address
          params.liquidityProviderAddress as `0x${string}` // Liquidity provider
        ],
        value: tokenAmount // Send ETH amount as value
      });
      
      logger.log('TRANSACTION', `Swap order creation transaction sent: ${hash}`);
      setTxHash(hash);
      
      return hash;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Swap order creation failed: ${errorMsg}`, error);
      
      // FIXED: Better error classification
      if (errorMsg.includes("user rejected")) {
        setError("Transaction was rejected in your wallet. Please try again.");
      } else if (errorMsg.includes("insufficient funds")) {
        setError("You have insufficient ETH in your wallet to complete this transaction.");
      } else if (errorMsg.includes("gas")) {
        setError("Gas estimation failed. Your transaction may fail or the network is congested.");
      } else if (errorMsg.includes("price impact too high")) {
        setError("Price impact is too high. Try a smaller amount or try again later when liquidity improves.");
      } else {
        setError(`Swap order creation failed: ${errorMsg}`);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Creates an order with a custom path (for USDT, ZORA, DEGEN etc.)
   * FIXED: Using single writeContractAsync, better error handling
   */
  const createOrderWithPath = async (params: PathOrderParams): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Get token config
      const tokenConfig = supportedTokens[params.tokenSymbol as keyof typeof supportedTokens];
      if (!tokenConfig) {
        throw new Error(`Token ${params.tokenSymbol} not supported`);
      }
      
      const USDC_CONFIG = supportedTokens.USDC;
      
      logger.log('TRANSACTION', `Creating path order for ${params.tokenAmount} ${params.tokenSymbol} to ${params.targetCurrency} via USDC`);
      
      // Use predefined multi-hop path if available, or custom path if provided, 
      // or default to token → USDC as fallback
      const path = params.path || 
                  TOKEN_PATHS[params.tokenSymbol as keyof typeof TOKEN_PATHS] || 
                  [tokenConfig.address, USDC_ADDRESS];
      
      // FIXED: Validate path to ensure all addresses are valid
      const validPath = path.filter(addr => addr !== undefined && addr !== null);
      if (validPath.length < 2) {
        throw new Error(`Invalid swap path for ${params.tokenSymbol}. Please check token configuration.`);
      }
      
      logger.log('TRANSACTION', `Using path for ${params.tokenSymbol}:`, validPath);
      
      // Parse amount with proper decimals
      const tokenAmount = parseUnits(params.tokenAmount, tokenConfig.decimals);
      
      // Use provided minOutputAmount, or estimated USDC with slippage, or conservative default
      let minOutputAmount;
      if (params.minOutputAmount && params.minOutputAmount !== "0") {
        minOutputAmount = parseUnits(params.minOutputAmount, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using provided min output amount: ${params.minOutputAmount}`);
      } else if (params.estimatedUSDCAmount) {
        const minUSDC = calculateMinAmount(params.estimatedUSDCAmount, 0.5);
        minOutputAmount = parseUnits(minUSDC, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using estimated USDC min amount: ${minUSDC}`);
      } else {
        // FIXED: Use a more sensible default (0.01% of input) instead of zero
        const conservativeMin = (parseFloat(params.tokenAmount) * 0.0001).toFixed(USDC_CONFIG.decimals);
        minOutputAmount = parseUnits(conservativeMin, USDC_CONFIG.decimals);
        logger.log('TRANSACTION', `Using conservative min amount: ${conservativeMin} USDC`);
      }
      
      // FIXED: Proper handling of rate decimals (18 decimals)
      const rateWithDecimals = parseUnits(params.rate.toString(), 18);
      
      const hash = await writeContractAsync({
        address: GATEWAY_CONTRACT_ADDRESS as `0x${string}`,
        abi: gatewayAbi,
        functionName: 'createOrderWithCustomPath',
        args: [
          validPath.map(addr => addr as `0x${string}`),
          tokenAmount,
          minOutputAmount,
          rateWithDecimals,
          walletAddress as `0x${string}`, // Refund address
          params.liquidityProviderAddress as `0x${string}` // Liquidity provider
        ]
      });
      
      logger.log('TRANSACTION', `Path order creation transaction sent: ${hash}`);
      setTxHash(hash);
      
      return hash;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.log('ERROR', `Path order creation failed: ${errorMsg}`, error);
      
      // FIXED: Better error classification
      if (errorMsg.includes("user rejected")) {
        setError("Transaction was rejected in your wallet. Please try again.");
      } else if (errorMsg.includes("insufficient funds")) {
        setError("You have insufficient funds in your wallet to complete this transaction.");
      } else if (errorMsg.includes("gas")) {
        setError("Gas estimation failed. Your transaction may fail or the network is congested.");
      } else if (errorMsg.includes("execution reverted")) {
        setError("Transaction would fail. This might be due to insufficient liquidity or high price impact.");
      } else if (errorMsg.includes("path")) {
        setError("Invalid swap path. Please try a different token or contact support.");
      } else {
        setError(`Path order creation failed: ${errorMsg}`);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    estimateUSDCForSwap,
    approveTokenSpending,
    createTokenOrder,
    createOrderWithSwapAndConversion,
    createOrderWithPath,
    isLoading,
    isEstimating,
    isWaitingForTx,
    isTxSuccess,
    error,
    txHash,
    estimatedUSDC
  };
}