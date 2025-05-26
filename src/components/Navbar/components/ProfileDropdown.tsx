import { useState, useRef, useEffect } from "react";
import {
   User,
   ChevronDown,
   ExternalLink,
   Copy,
   LogOut,
   Download,
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
   const dropdownRef = useRef<HTMLDivElement>(null);
   const { exportWallet, ready, authenticated, user } = usePrivy();

   // Check if user has an embedded wallet
   const hasEmbeddedWallet = !!user?.linkedAccounts.find(
      (account) =>
         account.type === "wallet" &&
         account.walletClientType === "privy" &&
         account.chainType === "ethereum"
   );

   // Toggle dropdown visibility
   const toggleDropdown = () => setIsOpen(!isOpen);

   // Enhanced copy function with toast
   const handleCopy = () => {
      onCopy();
      toast.success("Address copied to clipboard", { duration: 2000 });
   };

   // Export wallet using Privy's built-in modal
   const handleExportWallet = async () => {
      try {
         if (!hasEmbeddedWallet) {
            toast.error("No embedded wallet found");
            return;
         }

         await exportWallet();
         setIsOpen(false);
         toast.success("Export modal opened");
      } catch (error) {
         console.error("Failed to export wallet:", error);
         toast.error("Failed to open export modal");
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
         {/* Profile button with enhanced keyboard accessibility */}
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

         {/* Profile Dropdown Menu with enhanced spring animation */}
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
                        <a
                           href={`https://basescan.org/address/${walletAddress}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                           <span className="text-base">View on Explorer</span>
                           <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Export wallet - only show for embedded wallets */}
                        {hasEmbeddedWallet && ready && authenticated && (
                           <button
                              onClick={handleExportWallet}
                              className="flex items-center justify-between px-3 py-2 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md transition-colors">
                              <span className="text-base">Export Wallet</span>
                              <Download className="w-4 h-4" />
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
