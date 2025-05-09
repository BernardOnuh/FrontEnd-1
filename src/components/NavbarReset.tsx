import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
   Menu,
   X,
   Wallet,
   Settings,
   User,
   ChevronDown,
   ExternalLink,
   Copy,
   LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { usePrivy } from "@privy-io/react-auth";
import { JsonRpcProvider, formatEther } from "ethers";

// Extended type definitions for Privy
interface PrivyWallet {
   address: string;
   metadata?: {
      bns?: string;
   };
}

interface PrivyUser {
   wallet?: PrivyWallet;
}

interface NavbarProps {
   isLanding?: boolean;
}

const Navbar = ({ isLanding = true }: NavbarProps) => {
   // State
   const [isOpen, setIsOpen] = useState(false);
   const [isProfileOpen, setIsProfileOpen] = useState(false);
   const [balance, setBalance] = useState<string>("0.00");
   const [truncatedAddress, setTruncatedAddress] = useState<string | null>(
      null
   );
   const [bnsName, setBnsName] = useState<string | null>(null);
   const [copySuccess, setCopySuccess] = useState(false);

   // Refs
   const profileDropdownRef = useRef<HTMLDivElement>(null);

   // Hooks
   const { login, user, logout } = usePrivy();
   const navigate = useNavigate();
   const location = useLocation();
   const privyUser = user as unknown as PrivyUser | undefined;

   // Toggle mobile menu
   const toggleMenu = () => setIsOpen(!isOpen);

   // Toggle profile dropdown
   const toggleProfileDropdown = () => setIsProfileOpen(!isProfileOpen);

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
         setIsProfileOpen(false);
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

   // Handle clicks outside profile dropdown
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            profileDropdownRef.current &&
            !profileDropdownRef.current.contains(event.target as Node)
         ) {
            setIsProfileOpen(false);
         }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
         document.removeEventListener("mousedown", handleClickOutside);
   }, []);

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
         if (isLanding) {
            navigate("/app");
         }

         return () => clearInterval(interval);
      }
   }, [user, navigate, isLanding]);

   // Check active link
   const isActiveLink = (path: string) => location.pathname === path;

   return (
      <nav
         className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] z-50 backdrop-blur-md bg-purple-300 dark:bg-gray-900/70 text-gray-900 dark:text-white rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50"
         style={{
            boxShadow:
               "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
            borderImage:
               "linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1)) 1",
         }}>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
               {/* Logo and Navigation Links - Left aligned together */}
               <div className="flex items-center">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                     <Link to="/" className="flex items-center">
                        <Logo />
                     </Link>
                  </div>

                  {/* Desktop Navigation */}
                  <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                     {privyUser?.wallet?.address ? (
                        /* Authenticated navigation */
                        <>
                           <Link
                              to="/app"
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                 isActiveLink("/app")
                                    ? "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                              }`}>
                              Swap
                           </Link>
                           <Link
                              to="/activity"
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                 isActiveLink("/activity")
                                    ? "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                              }`}>
                              Activity
                           </Link>
                        </>
                     ) : (
                        /* Unauthenticated navigation */
                        <>
                           <Link
                              to="/"
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                 isActiveLink("/")
                                    ? "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                              }`}>
                              Home
                           </Link>
                           <Link
                              to="#features"
                              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                              Features
                           </Link>
                           <Link
                              to="#about"
                              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                              About
                           </Link>
                           <Link
                              to="#faq"
                              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                              FAQ
                           </Link>
                        </>
                     )}
                  </div>
               </div>

               {/* Right Section */}
               <div className="flex items-center space-x-3">
                  {privyUser?.wallet?.address ? (
                     /* Authenticated state */
                     <>
                        {/* Wallet Balance */}
                        <div className="hidden sm:flex items-center bg-gray-100/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg mr-2 backdrop-blur-sm">
                           <Wallet className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                           <span className="text-sm font-medium">
                              ${balance}
                           </span>
                           <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">
                              ↓
                           </span>
                        </div>

                        {/* Network Indicator with Explorer Link */}
                        <div className="hidden sm:flex items-center bg-gray-100/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                           <div className="flex items-center">
                              <svg
                                 className="w-4 h-4 mr-1"
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
                              <span className="text-sm font-medium mr-2">
                                 Base
                              </span>

                              {/* Explorer Link */}
                              <a
                                 href={`https://basescan.org/address/${privyUser.wallet.address}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-xs text-blue-500 hover:text-blue-400 flex items-center"
                                 title="View on Explorer">
                                 <ExternalLink className="w-3 h-3" />
                              </a>
                           </div>
                        </div>

                        {/* Settings Button */}
                        <button className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-sm">
                           <Settings className="h-5 w-5" />
                        </button>

                        {/* User Profile with Dropdown */}
                        <div className="relative" ref={profileDropdownRef}>
                           <button
                              onClick={toggleProfileDropdown}
                              className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              <User className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium hidden sm:inline mr-1">
                                 {bnsName || truncatedAddress}
                              </span>
                              <ChevronDown className="h-3 w-3 text-gray-500" />
                           </button>

                           {/* Copy Success Indicator */}
                           {copySuccess && (
                              <div className="absolute top-0 right-0 -mt-8 px-2 py-1 bg-green-500 text-white text-xs rounded-md">
                                 Copied!
                              </div>
                           )}

                           {/* Profile Dropdown */}
                           <AnimatePresence>
                              {isProfileOpen && (
                                 <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg z-10 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <div className="p-4">
                                       <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                             Connected as
                                          </p>
                                          <div className="flex items-center justify-between mt-1">
                                             <p className="text-sm font-medium flex items-center">
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
                                                onClick={copyAddressToClipboard}
                                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                                                title="Copy full address">
                                                <Copy className="w-4 h-4" />
                                             </button>
                                          </div>
                                       </div>

                                       <div className="mb-4">
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                             Balance
                                          </p>
                                          <p className="text-xl font-medium">
                                             ${balance}
                                          </p>
                                       </div>

                                       <div className="flex flex-col space-y-2">
                                          <a
                                             href={`https://basescan.org/address/${privyUser.wallet.address}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                                             <span className="text-sm">
                                                View on Explorer
                                             </span>
                                             <ExternalLink className="w-4 h-4" />
                                          </a>

                                          <button
                                             onClick={handleDisconnect}
                                             className="flex items-center justify-between px-3 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors">
                                             <span className="text-sm font-medium">
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
                     </>
                  ) : (
                     /* Unauthenticated state - Connect Wallet button that shrinks */
                     <motion.button
                        onClick={handleConnect}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 
                   text-white font-medium py-2 px-4 sm:px-6 text-xs sm:text-sm whitespace-nowrap rounded-full flex items-center w-auto sm:w-auto">
                        <Wallet className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">Connect Wallet</span>
                     </motion.button>
                  )}

                  {/* Mobile menu button */}
                  <div className="md:hidden flex items-center">
                     <button
                        onClick={toggleMenu}
                        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:outline-none backdrop-blur-sm">
                        <span className="sr-only">Open main menu</span>
                        {isOpen ? (
                           <X className="block h-6 w-6" aria-hidden="true" />
                        ) : (
                           <Menu className="block h-6 w-6" aria-hidden="true" />
                        )}
                     </button>
                  </div>
               </div>
            </div>
         </div>

         {/* Mobile menu */}
         {isOpen && (
            <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-b-2xl shadow-lg overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50">
               <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {privyUser?.wallet?.address ? (
                     /* Authenticated mobile navigation */
                     <>
                        <Link
                           to="/app"
                           className={`block px-3 py-2 rounded-md text-base font-medium ${
                              isActiveLink("/app")
                                 ? "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white"
                                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                           }`}>
                           Swap
                        </Link>
                        <Link
                           to="/activity"
                           className={`block px-3 py-2 rounded-md text-base font-medium ${
                              isActiveLink("/activity")
                                 ? "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white"
                                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                           }`}>
                           Activity
                        </Link>

                        {/* Mobile only - wallet info */}
                        <div className="mt-3 px-3 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
                           <div className="flex items-center justify-between mb-3">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                 Connected as
                              </p>
                              <div className="flex items-center">
                                 <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                 <button
                                    onClick={copyAddressToClipboard}
                                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                                    title="Copy full address">
                                    <Copy className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                           <div className="text-sm font-medium mb-3">
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
                                 <Wallet className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                 <span className="text-sm font-medium">
                                    ${balance}
                                 </span>
                              </div>
                              <div className="flex items-center">
                                 <svg
                                    className="w-4 h-4 mr-1"
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
                                 <span className="text-sm font-medium">
                                    Base
                                 </span>
                              </div>
                           </div>
                           <div className="flex flex-col space-y-2 mt-4">
                              <a
                                 href={`https://basescan.org/address/${privyUser?.wallet?.address}`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center justify-between px-3 py-2 bg-gray-100/70 dark:bg-gray-700/70 hover:bg-gray-200/70 dark:hover:bg-gray-600/70 rounded-md transition-colors">
                                 <span className="text-sm">
                                    View on Explorer
                                 </span>
                                 <ExternalLink className="w-4 h-4" />
                              </a>

                              <button
                                 onClick={handleDisconnect}
                                 className="flex items-center justify-between px-3 py-2 bg-red-100/70 dark:bg-red-900/20 hover:bg-red-200/70 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors">
                                 <span className="text-sm font-medium">
                                    Disconnect Wallet
                                 </span>
                                 <LogOut className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     </>
                  ) : (
                     /* Unauthenticated mobile navigation */
                     <>
                        <Link
                           to="/"
                           className={`block px-3 py-2 rounded-md text-base font-medium ${
                              isActiveLink("/")
                                 ? "bg-[#9d4de7de] dark:bg-[#9d4de7de] text-gray-900 dark:text-white"
                                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white"
                           }`}>
                           Home
                        </Link>
                        <Link
                           to="#features"
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                           Features
                        </Link>
                        <Link
                           to="#about"
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                           About
                        </Link>
                        <Link
                           to="#faq"
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white">
                           FAQ
                        </Link>
                     </>
                  )}
               </div>
            </div>
         )}
      </nav>
   );
};

export default Navbar;
