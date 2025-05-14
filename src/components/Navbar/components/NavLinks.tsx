import { Link, useLocation } from "react-router-dom";

interface NavLinksProps {
   isConnected: boolean;
   isMobile?: boolean;
}

const NavLinks: React.FC<NavLinksProps> = ({
   isConnected,
   isMobile = false,
}) => {
   const location = useLocation();

   // Check active link
   const isActiveLink = (path: string) => location.pathname === path;

   const linkClass = isMobile
      ? "block px-3 py-2 rounded-md text-base font-medium"
      : "px-3 py-2 rounded-md text-base font-medium";

   const activeLinkClass =
      "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white";
   const inactiveLinkClass =
      "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white";

   return (
      <>
         {isConnected ? (
            /* Authenticated navigation */
            <>
               <Link
                  to="/app"
                  className={`${linkClass} ${
                     isActiveLink("/app") ? activeLinkClass : inactiveLinkClass
                  }`}>
                  Swap
               </Link>
               <Link
                  to="/activity"
                  className={`${linkClass} ${
                     isActiveLink("/activity")
                        ? activeLinkClass
                        : inactiveLinkClass
                  }`}>
                  Activity
               </Link>
               <Link
                  to="/add-liquidity"
                  className={`${linkClass} ${
                     isActiveLink("/add-liquidity")
                        ? activeLinkClass
                        : inactiveLinkClass
                  }`}>
                  Provide Liquidity
               </Link>
            </>
         ) : (
            /* Unauthenticated navigation */
            <>
               <Link
                  to="/"
                  className={`${linkClass} ${
                     isActiveLink("/") ? activeLinkClass : inactiveLinkClass
                  }`}>
                  Home
               </Link>
               <Link
                  to="/add-liquidity"
                  className={`${linkClass} ${inactiveLinkClass}`}>
                  Add Liquidity
               </Link>
               <Link
                  to="#about"
                  className={`${linkClass} ${inactiveLinkClass}`}>
                  About
               </Link>
               <Link to="#faq" className={`${linkClass} ${inactiveLinkClass}`}>
                  FAQ
               </Link>
            </>
         )}
      </>
   );
};

export default NavLinks;
