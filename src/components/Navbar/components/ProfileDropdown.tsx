import { useState, useRef, useEffect } from "react";
import {
   User,
   ChevronDown,
   ExternalLink,
   Copy,
   LogOut,
   Download,
   AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface ProfileDropdownProps {
   truncatedAddress: string | null;
   bnsName: string | null;
   balance: string;
   walletAddress: string;
   onCopy: () => void;
   onDisconnect: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
   truncatedAddress,
   bnsName,
   balance,
   walletAddress,
   onCopy,
   onDisconnect,
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const [isExporting, setIsExporting] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const { exportWallet, ready, authenticated, getAccessToken, user } = usePrivy();
   const { wallets } = useWallets();

   // DEBUG: Log all critical state on render
   useEffect(() => {
      console.group("🔍 Wallet Debug Info");
      console.log("Current connected address:", walletAddress);
      console.log("Total wallets available:", wallets.length);
      console.log("Privy ready:", ready);
      console.log("User authenticated:", authenticated);
      console.log("User ID:", user?.id);
      
      wallets.forEach((wallet, index) => {
         console.log(`\nWallet ${index + 1}:`, {
            address: wallet.address,
            clientType: wallet.walletClientType,
            connectorType: wallet.connectorType,
            imported: wallet.imported,
            isConnected: wallet.address.toLowerCase() === walletAddress.toLowerCase(),
         });
      });
      console.groupEnd();
   }, [wallets, walletAddress, ready, authenticated, user]);

   // Find the Privy embedded wallet (not the connected wallet)
   const embeddedWallet = wallets.find(
      (wallet) =>
         wallet.walletClientType === "privy" && 
         !wallet.imported // Ensure it's not an imported wallet
   );

   // Check if current connected wallet is the embedded wallet
   const isUsingEmbeddedWallet = embeddedWallet?.address.toLowerCase() === walletAddress.toLowerCase();

   // Only allow export if using the embedded wallet
   const canExport = !!embeddedWallet && ready && authenticated && isUsingEmbeddedWallet;

   // DEBUG: Log export eligibility with detailed reasoning
   useEffect(() => {
      console.group("✅ Export Eligibility Check");
      console.log("Can Export:", canExport);
      console.log("Reasons:");
      console.log("  ✓ Has embedded wallet:", !!embeddedWallet);
      if (embeddedWallet) {
         console.log("    - Embedded wallet address:", embeddedWallet.address);
      }
      console.log("  ✓ Privy ready:", ready);
      console.log("  ✓ User authenticated:", authenticated);
      console.log("  ✓ Using embedded wallet:", isUsingEmbeddedWallet);
      console.log("    - Connected address:", walletAddress);
      console.log("    - Embedded address:", embeddedWallet?.address || "N/A");
      
      if (!canExport) {
         console.warn("⚠️ Export disabled because:");
         if (!embeddedWallet) console.warn("  - No embedded wallet found");
         if (!ready) console.warn("  - Privy not ready");
         if (!authenticated) console.warn("  - User not authenticated");
         if (!isUsingEmbeddedWallet) console.warn("  - Currently using external wallet (MetaMask/Coinbase). Switch to embedded wallet to export.");
      }
      console.groupEnd();
   }, [canExport, embeddedWallet, ready, authenticated, isUsingEmbeddedWallet, walletAddress]);

   // Toggle dropdown visibility
   const toggleDropdown = () => setIsOpen(!isOpen);

   // Enhanced copy function with toast
   const handleCopy = () => {
      onCopy();
      toast.success("Address copied to clipboard", { duration: 2000 });
   };

   // Export wallet with comprehensive debugging and validation
   const handleExportWallet = async () => {
      console.group("🚀 Export Wallet Process");
      console.log("Timestamp:", new Date().toISOString());

      // Pre-flight checks with detailed logging
      if (!embeddedWallet) {
         console.error("❌ FAILED: No embedded wallet exists");
         console.log("Available wallets:", wallets.map(w => ({
            address: w.address,
            type: w.walletClientType
         })));
         toast.error("No Privy embedded wallet found");
         console.groupEnd();
         return;
      }

      if (!isUsingEmbeddedWallet) {
         console.error("❌ FAILED: Not using embedded wallet");
         console.log("Current wallet:", walletAddress);
         console.log("Embedded wallet:", embeddedWallet.address);
         toast.error("Please switch to your Privy embedded wallet to export", {
            duration: 4000,
         });
         console.groupEnd();
         return;
      }

      if (!authenticated || !ready) {
         console.error("❌ FAILED: Authentication issue");
         console.log("  - Authenticated:", authenticated);
         console.log("  - Ready:", ready);
         toast.error("Authentication error. Please reconnect.");
         console.groupEnd();
         return;
      }

      console.log("✅ All pre-flight checks passed");
      setIsExporting(true);
      
      try {
         // Step 1: Get fresh access token
         console.log("📝 Step 1: Fetching access token...");
         const token = await getAccessToken();
         
         if (!token) {
            console.error("❌ No access token returned");
            toast.error("Session expired. Please reconnect.");
            setIsExporting(false);
            console.groupEnd();
            return;
         }

         console.log("✅ Access token received");
         console.log("  - Token length:", token.length);
         console.log("  - First 20 chars:", token.substring(0, 20) + "...");
         
         // Decode and validate JWT
         try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
               const payload = JSON.parse(atob(tokenParts[1]));
               const now = Date.now();
               const expiry = payload.exp * 1000;
               
               console.log("🔐 Token Details:");
               console.log("  - Issued at:", new Date(payload.iat * 1000).toISOString());
               console.log("  - Expires at:", new Date(expiry).toISOString());
               console.log("  - Time until expiry:", Math.round((expiry - now) / 1000 / 60), "minutes");
               console.log("  - Subject:", payload.sub);
               
               if (expiry < now) {
                  console.error("❌ Token is expired!");
                  toast.error("Session expired. Please reconnect.");
                  setIsExporting(false);
                  console.groupEnd();
                  return;
               }
               console.log("✅ Token is valid and not expired");
            }
         } catch (decodeError) {
            console.warn("⚠️ Could not decode token:", decodeError);
         }

         // Step 2: Call exportWallet
         console.log("📤 Step 2: Calling exportWallet()...");
         console.log("  - User ID:", user?.id);
         console.log("  - Wallet address:", embeddedWallet.address);
         console.log("  - Wallet type:", embeddedWallet.walletClientType);
         
         await exportWallet();
         
         console.log("✅ Export completed successfully!");
         
         // Success
         setTimeout(() => {
            setIsOpen(false);
            toast.success("Wallet exported successfully");
         }, 500);
         
      } catch (error: any) {
         console.error("❌ Export failed with error:");
         console.error("Error object:", error);
         console.error("Error name:", error?.name);
         console.error("Error message:", error?.message);
         console.error("Error stack:", error?.stack);
         
         // Log HTTP details if available
         if (error?.response) {
            console.error("HTTP Response:", {
               status: error.response.status,
               statusText: error.response.statusText,
               data: error.response.data,
            });
         }

         // Log request details if available
         if (error?.config) {
            console.error("Request Config:", {
               url: error.config.url,
               method: error.config.method,
            });
         }
         
         const errorMessage = error?.message || String(error);
         
         // Handle specific error types
         if (errorMessage.includes("JWT") || errorMessage.includes("token")) {
            console.error("🔒 JWT/Token authentication error");
            toast.error("Session expired. Please reconnect your wallet.");
         } else if (
            errorMessage.includes("User closed") || 
            errorMessage.includes("User rejected") ||
            errorMessage.includes("cancelled")
         ) {
            console.log("ℹ️ User cancelled the export");
            // Don't show error toast for user cancellation
         } else {
            console.error("🔥 Unexpected error occurred");
            toast.error("Failed to export wallet. Please try again.");
         }
      } finally {
         setIsExporting(false);
         console.groupEnd();
      }
   };

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
         document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   // Escape key to close dropdown
   useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
         if (e.key === "Escape") {
            setIsOpen(false);
         }
      };

      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
   }, []);

   return (
      <div className="relative" ref={dropdownRef}>
         {/* Profile button */}
         <button
            onClick={toggleDropdown}
            aria-expanded={isOpen}
            tabIndex={0}
            className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <User className="h-5 w-5 mr-2" />
            <span className="text-lg font-medium hidden sm:inline mr-1">
               {bnsName || truncatedAddress}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
         </button>

         {/* Profile Dropdown Menu */}
         <AnimatePresence>
            {isOpen && (
               <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{
                     type: "spring",
                     stiffness: 300,
                     damping: 20,
                     delay: 0.1,
                  }}
                  className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-10 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="p-4">
                     {/* Connected account section */}
                     <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                           Connected as
                        </p>
                        <div className="flex items-center justify-between mt-1">
                           <p className="text-base font-medium flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              {bnsName ? (
                                 <span className="font-semibold text-blue-500">
                                    {bnsName}
                                 </span>
                              ) : (
                                 truncatedAddress
                              )}
                           </p>
                           <button
                              onClick={handleCopy}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                              title="Copy full address"
                              aria-label="Copy wallet address">
                              <Copy className="w-4 h-4" />
                           </button>
                        </div>
                        
                        {/* Warning if not using embedded wallet */}
                        {embeddedWallet && !isUsingEmbeddedWallet && (
                           <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                 Using external wallet. Switch to Privy wallet to enable export.
                              </p>
                           </div>
                        )}
                     </div>

                     {/* Balance section */}
                     <div className="mb-4">
                        <p className="text-base text-gray-500 dark:text-gray-400">
                           Balance
                        </p>
                        <p className="text-2xl font-medium">${balance}</p>
                     </div>

                     {/* Action buttons */}
                     <div className="flex flex-col space-y-2">
                        
                          <a href={`https://basescan.org/address/${walletAddress}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                           <span className="text-base">View on Explorer</span>
                           <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Export wallet button - only show for embedded wallet */}
                        {embeddedWallet && (
                           <button
                              onClick={handleExportWallet}
                              disabled={isExporting || !canExport}
                              title={
                                 !isUsingEmbeddedWallet
                                    ? "Switch to Privy embedded wallet to export"
                                    : "Export your wallet private key"
                              }
                              className="relative flex items-center justify-between px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
                              {/* Animated progress bar */}
                              {isExporting && (
                                 <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "90%" }}
                                    transition={{
                                       duration: 2.5,
                                       ease: "easeOut",
                                    }}
                                    className="absolute left-0 top-0 h-full bg-blue-200 dark:bg-blue-900/40"
                                 />
                              )}
                              
                              {/* Button content */}
                              <span className="text-base relative z-10">
                                 {isExporting ? "Exporting..." : "Export Wallet"}
                              </span>
                              <Download className="w-4 h-4 relative z-10" />
                           </button>
                        )}

                        <button
                           onClick={onDisconnect}
                           className="flex items-center justify-between px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors">
                           <span className="text-base font-medium">
                              Disconnect Wallet
                           </span>
                           <LogOut className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default ProfileDropdown;