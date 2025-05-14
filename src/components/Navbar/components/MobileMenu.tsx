import { useEffect } from "react";
import { IoWalletSharp } from "react-icons/io5";
import { Copy, ExternalLink, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import {toast} from "react-hot-toast";
import { toast } from "sonner";
import NavLinks from "./NavLinks";

interface MobileMenuProps {
   isOpen: boolean;
   isConnected: boolean;
   truncatedAddress: string | null;
   bnsName: string | null;
   balance: string;
   walletAddress: string;
   onCopy: () => void;
   onDisconnect: () => void;
   onClose?: () => void; // Added for accessibility
}

const MobileMenu: React.FC<MobileMenuProps> = ({
   isOpen,
   isConnected,
   truncatedAddress,
   bnsName,
   balance,
   walletAddress,
   onCopy,
   onDisconnect,
   onClose,
}) => {
   // Enhanced copy function with toast
   const handleCopy = () => {
      onCopy();
      toast.success("Address copied to clipboard", { duration: 2000 });
   };

   // Handle Escape key press
   useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
         if (e.key === "Escape" && isOpen && onClose) {
            onClose();
         }
      };

      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
   }, [isOpen, onClose]);

   // Focus trap when menu is open
   useEffect(() => {
      if (isOpen) {
         // Set focus to the menu container when it opens
         const menuContainer = document.getElementById("mobile-menu-container");
         if (menuContainer) {
            menuContainer.focus();
         }
      }
   }, [isOpen]);

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               id="mobile-menu-container"
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
               }}
               className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-b-2xl shadow-lg overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50"
               tabIndex={-1} // For focus trapping
               aria-modal="true"
               role="dialog">
               <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {/* Navigation links - only shown when authenticated */}
                  <NavLinks isConnected={isConnected} isMobile={true} />

                  {/* Mobile wallet info (only shown when connected) */}
                  {isConnected && (
                     <div className="mt-3 px-3 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
                        {/* Connected account section */}
                        <div className="flex items-center justify-between mb-3">
                           <p className="text-base text-gray-500 dark:text-gray-400">
                              Connected as
                           </p>
                           <div className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              <button
                                 onClick={handleCopy}
                                 className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                                 title="Copy full address"
                                 aria-label="Copy wallet address">
                                 <Copy className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                        <div className="text-lg font-medium mb-3">
                           {bnsName ? (
                              <span className="font-semibold text-blue-500">
                                 {bnsName}
                              </span>
                           ) : (
                              truncatedAddress
                           )}
                        </div>

                        {/* Balance and network section */}
                        <div className="flex justify-between items-center mb-3">
                           <div className="flex items-center">
                              <IoWalletSharp className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                              <span className="text-base font-medium">
                                 ${balance}
                              </span>
                           </div>
                           <div className="flex items-center">
                              <svg
                                 className="w-5 h-5 mr-1"
                                 viewBox="0 0 24 24"
                                 fill="none"
                                 xmlns="http://www.w3.org/2000/svg">
                                 <circle
                                    cx="12"
                                    cy="12"
                                    r="12"
                                    fill="#0052FF"
                                 />
                                 <path
                                    d="M8 12L12 8L16 12L12 16L8 12Z"
                                    fill="white"
                                 />
                              </svg>
                              <span className="text-base font-medium">
                                 Base
                              </span>
                           </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col space-y-2 mt-4">
                           <a
                              href={`https://basescan.org/address/${walletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-2 bg-gray-100/70 dark:bg-gray-700/70 hover:bg-gray-200/70 dark:hover:bg-gray-600/70 rounded-md transition-colors">
                              <span className="text-base">
                                 View on Explorer
                              </span>
                              <ExternalLink className="w-4 h-4" />
                           </a>

                           <button
                              onClick={onDisconnect}
                              className="flex items-center justify-between px-3 py-2 bg-red-100/70 dark:bg-red-900/20 hover:bg-red-200/70 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors">
                              <span className="text-base font-medium">
                                 Disconnect Wallet
                              </span>
                              <LogOut className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default MobileMenu;
