import { IoWalletSharp } from "react-icons/io5";
import { Copy, ExternalLink, LogOut } from "lucide-react";
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
}) => {
   if (!isOpen) return null;

   const handleCopy = () => {
      onCopy();
      toast.success("Copied!");
   };

   return (
      <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-b-2xl shadow-lg overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 ease-in-out">
         <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLinks isConnected={isConnected} isMobile={true} />

            {isConnected && (
               <div className="mt-3 px-3 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                     <p className="text-base text-gray-500 dark:text-gray-400">
                        Connected as
                     </p>
                     <div className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        <button
                           onClick={handleCopy}
                           className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                           title="Copy full address">
                           <Copy className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                  <div className="text-base font-medium mb-3">
                     {bnsName ? (
                        <span className="font-semibold text-blue-500">
                           {bnsName}
                        </span>
                     ) : (
                        truncatedAddress
                     )}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center">
                        <IoWalletSharp className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium">${balance}</span>
                     </div>
                     <div className="flex items-center">
                        <svg
                           className="w-4 h-4 mr-1"
                           viewBox="0 0 24 24"
                           fill="none"
                           xmlns="http://www.w3.org/2000/svg">
                           <circle cx="12" cy="12" r="12" fill="#0052FF" />
                           <path
                              d="M8 12L12 8L16 12L12 16L8 12Z"
                              fill="white"
                           />
                        </svg>
                        <span className="text-sm font-medium">Base</span>
                     </div>
                  </div>
                  <div className="flex flex-col space-y-2 mt-4">
                     <a
                        href={`https://basescan.org/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 bg-gray-100/70 dark:bg-gray-700/70 hover:bg-gray-200/70 dark:hover:bg-gray-600/70 rounded-md transition-colors">
                        <span className="text-sm">View on Explorer</span>
                        <ExternalLink className="w-4 h-4" />
                     </a>

                     <button
                        onClick={onDisconnect}
                        className="flex items-center justify-between px-3 py-2 bg-red-100/70 dark:bg-red-900/20 hover:bg-red-200/70 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors">
                        <span className="text-sm font-medium">
                           Disconnect Wallet
                        </span>
                        <LogOut className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default MobileMenu;
