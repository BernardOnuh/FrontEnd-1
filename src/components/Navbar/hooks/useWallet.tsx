import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { JsonRpcProvider, formatEther } from "ethers";
import { useNavigate, useLocation } from "react-router-dom";

// Type definitions
interface PrivyWallet {
   address: string;
   metadata?: {
      bns?: string;
   };
}

interface PrivyUser {
   wallet?: PrivyWallet;
}

export const useWallet = (isLanding = true) => {
   // State
   const [balance, setBalance] = useState<string>("0.00");
   const [truncatedAddress, setTruncatedAddress] = useState<string | null>(
      null
   );
   const [bnsName, setBnsName] = useState<string | null>(null);
   const [copySuccess, setCopySuccess] = useState(false);

   // Hooks
   const { login, user, logout } = usePrivy();
   const navigate = useNavigate();
   const location = useLocation();
   const privyUser = user as unknown as PrivyUser | undefined;

   // Handle wallet connection
   const handleConnect = async () => {
      try {
         await login();
         if (privyUser?.wallet?.address) {
            await updateBalanceAndAddress();
            navigate("/app");
         }
      } catch (error) {
         console.error("Privy login failed:", error);
      }
   };

   // Handle wallet disconnection
   const handleDisconnect = async () => {
      try {
         await logout();
         setBalance("0.00");
         setTruncatedAddress(null);
         setBnsName(null);
         navigate("/");
      } catch (error) {
         console.error("Logout failed:", error);
      }
   };

   // Copy address to clipboard
   const copyAddressToClipboard = () => {
      if (privyUser?.wallet?.address) {
         navigator.clipboard.writeText(privyUser.wallet.address);
         setCopySuccess(true);
         setTimeout(() => {
            setCopySuccess(false);
         }, 2000);
      }
   };

   // Update balance and format address
   const updateBalanceAndAddress = async () => {
      if (!privyUser?.wallet?.address) return;

      try {
         // Get balance
         const provider = new JsonRpcProvider("https://mainnet.base.org");
         const rawBalance = await provider.getBalance(privyUser.wallet.address);
         const formattedBalance = parseFloat(formatEther(rawBalance)).toFixed(
            2
         );
         setBalance(formattedBalance);

         // Format address for display
         const address = privyUser.wallet.address;
         setTruncatedAddress(
            `${address.substring(0, 6)}...${address.substring(
               address.length - 4
            )}`
         );
      } catch (error) {
         console.error("Failed to fetch balance:", error);
      }
   };

   // Update balance periodically and check for BNS name in Privy metadata
   useEffect(() => {
      if (privyUser?.wallet?.address) {
         // Get BNS name from Privy metadata if available
         const bnsFromMetadata = privyUser.wallet.metadata?.bns;
         if (bnsFromMetadata) {
            setBnsName(bnsFromMetadata);
         }

         updateBalanceAndAddress();
         const interval = setInterval(updateBalanceAndAddress, 30000);

         // Redirect if authenticated
         if (location.pathname === "/" && isLanding) {
            navigate("/app");
         }

         return () => clearInterval(interval);
      }
   }, [
      user,
      navigate,
      isLanding,
      location.pathname,
      privyUser?.wallet?.address,
   ]);

   const walletAddress = privyUser?.wallet?.address;

   return {
      isConnected: !!walletAddress,
      walletAddress,
      balance,
      truncatedAddress,
      bnsName,
      copySuccess,
      handleConnect,
      handleDisconnect,
      copyAddressToClipboard,
   };
};
