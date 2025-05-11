import { JsonRpcProvider, formatEther } from "ethers";

export const fetchWalletBalances = async (address: string) => {
   try {
      const provider = new JsonRpcProvider("https://mainnet.base.org");

      // For demo purposes, let's just fetch ETH balance and use mock data for others
      const ethBalance = await provider.getBalance(address);
      const formattedEthBalance = formatEther(ethBalance);

      // In a real app, you'd fetch actual token balances
      const balances = {
         ETH: parseFloat(formattedEthBalance).toFixed(4),
         BTC: "0.0234", // Mock data
         USDC: "1,005.43", // Mock data
         DAI: "750.21", // Mock data
      };

      console.log("Wallet balances fetched:", balances);
      return balances;
   } catch (error) {
      console.error("Failed to fetch wallet balances:", error);
      return {};
   }
};
