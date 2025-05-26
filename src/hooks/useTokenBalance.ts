// src/hooks/useTokenBalance.ts
import { useEffect } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { erc20Abi, formatUnits } from "viem";

interface UseTokenBalanceResult {
   balance: string;
   isLoading: boolean;
   error: Error | null;
}

/**
 * Hook to fetch the balance of a single token (native ETH or ERC20).
 * @param tokenAddress - The ERC20 token contract address, or undefined/"eth" for native ETH
 * @param decimals - Number of decimals to format the returned balance
 */
export function useTokenBalance(
   tokenAddress: string | undefined,
   decimals: number = 18
): UseTokenBalanceResult {
   const { address, isConnected } = useAccount();

   // Determine if we should fetch native ETH or an ERC20 token
   const isNativeToken = !tokenAddress || tokenAddress.toLowerCase() === "eth";

   // Fetch native ETH balance
   const {
      data: ethData,
      isLoading: ethLoading,
      error: ethError,
   } = useBalance({
      address: address,
      query: {
         enabled: Boolean(address && isConnected && isNativeToken),
      },
   });

   // Fetch ERC20 token balance - ALWAYS call the hook, use query.enabled to control execution
   const {
      data: tokenData,
      isLoading: tokenLoading,
      error: tokenError,
   } = useReadContract({
      address:
         (tokenAddress as `0x${string}`) ||
         "0x0000000000000000000000000000000000000000",
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address || "0x0000000000000000000000000000000000000000"],
      query: {
         enabled: Boolean(
            address &&
               isConnected &&
               !isNativeToken &&
               tokenAddress?.startsWith("0x")
         ),
      },
   });

   // Choose formatted result
   const formattedBalance = isNativeToken
      ? ethData?.formatted ?? "0"
      : tokenData
      ? formatUnits(tokenData as bigint, decimals)
      : "0";

   return {
      balance: formattedBalance,
      isLoading: isNativeToken ? ethLoading : tokenLoading,
      error: (isNativeToken ? ethError : tokenError) as Error | null,
   };
}

/**
 * Hook to fetch multiple token balances at once.
 * @param tokens - Record of symbol => { address, decimals }
 */
export function useTokenBalances(
   tokens: Record<string, { address: string; decimals: number }>
) {
   const { address, isConnected, chainId } = useAccount();

   // Fixed: Create stable token entries array to prevent dependency changes
   const tokenEntries = Object.entries(tokens);

   // Create balances object with stable references
   const balances: Record<
      string,
      { balance: string; isLoading: boolean; error: string | null }
   > = {};

   // Process each token balance
   tokenEntries.forEach(([symbol, token]) => {
      const { balance, isLoading, error } = useTokenBalance(
         token.address,
         token.decimals
      );

      balances[symbol] = {
         balance: isLoading ? "..." : balance,
         isLoading,
         error: error ? String(error) : null,
      };
   });

   // Log connection state for debugging (only when it changes)
   useEffect(() => {
      console.log(
         `Wallet State - Connected: ${isConnected}, Address: ${address}, Chain: ${chainId}`
      );
   }, [isConnected, address, chainId]);

   return {
      balances,
      isConnected,
      walletAddress: address,
   };
}
