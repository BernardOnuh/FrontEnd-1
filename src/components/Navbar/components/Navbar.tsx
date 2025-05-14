import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../../Logo-Black";
import NavLinks from "./NavLinks";
import WalletInfo from "./WalletInfo";
import ProfileDropdown from "./ProfileDropdown";
import ConnectButton from "./ConnectButton";
import MobileMenu from "./MobileMenu";
import { useWallet } from "../hooks/useWallet";

interface NavbarProps {
   isLanding?: boolean;
}

const Navbar = ({ isLanding = true }: NavbarProps) => {
   // Mobile menu toggle state
   const [isOpen, setIsOpen] = useState(false);

   // Custom hook for wallet functionality
   const {
      isConnected,
      walletAddress,
      balance,
      truncatedAddress,
      bnsName,
      copySuccess,
      handleConnect,
      handleDisconnect,
      copyAddressToClipboard,
   } = useWallet(isLanding);

   // Toggle mobile menu visibility
   const toggleMenu = () => setIsOpen(!isOpen);

   // Close menu for accessibility
   const closeMenu = () => setIsOpen(false);

   return (
      <nav className="fixed top-4 w-full z-50 text-gray-900 dark:text-white">
         <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
               {/* Left Section - Logo (and Nav Links if authenticated) */}
               <div className="flex items-center">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                     <Link to="/" className="flex items-center">
                        <Logo />
                     </Link>
                  </div>

                  {/* Desktop Navigation - Only shown when authenticated */}
                  {isConnected && (
                     <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                        <NavLinks isConnected={isConnected} />
                     </div>
                  )}
               </div>

               {/* Right Section */}
               <div className="flex items-center space-x-3">
                  {isConnected ? (
                     <>
                        {/* Wallet Balance - Only shown when authenticated */}
                        <WalletInfo balance={balance} />

                        {/* User Profile with Dropdown - Only shown when authenticated */}
                        <ProfileDropdown
                           truncatedAddress={truncatedAddress}
                           bnsName={bnsName}
                           balance={balance}
                           walletAddress={walletAddress!}
                           copySuccess={copySuccess}
                           onCopy={copyAddressToClipboard}
                           onDisconnect={handleDisconnect}
                        />

                        {/* Mobile menu button - ONLY SHOWN WHEN AUTHENTICATED */}
                        <div className="md:hidden flex items-center">
                           <button
                              onClick={toggleMenu}
                              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus:outline-none backdrop-blur-sm"
                              aria-expanded={isOpen}
                              aria-controls="mobile-menu-container">
                              <span className="sr-only">Open main menu</span>
                              {isOpen ? (
                                 <X
                                    className="block h-6 w-6"
                                    aria-hidden="true"
                                 />
                              ) : (
                                 <Menu
                                    className="block h-6 w-6"
                                    aria-hidden="true"
                                 />
                              )}
                           </button>
                        </div>
                     </>
                  ) : (
                     /* Unauthenticated state - Connect Wallet button */
                     <ConnectButton onClick={handleConnect} />
                  )}
               </div>
            </div>
         </div>

         {/* Mobile menu - only rendered when authenticated */}
         {isConnected && (
            <MobileMenu
               isOpen={isOpen}
               isConnected={isConnected}
               truncatedAddress={truncatedAddress}
               bnsName={bnsName}
               balance={balance}
               walletAddress={walletAddress || ""}
               onCopy={copyAddressToClipboard}
               onDisconnect={handleDisconnect}
               onClose={closeMenu} // Add this prop if your MobileMenu has this prop
            />
         )}
      </nav>
   );
};

export default Navbar;
