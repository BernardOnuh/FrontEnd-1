import { Link, useLocation } from "react-router-dom";

interface NavLinksProps {
   isConnected: boolean;
   isMobile?: boolean;
}

const NavLinks: React.FC<NavLinksProps> = ({
   isConnected,
   isMobile = false,
}) => {
   // Only render links when authenticated
   if (!isConnected) return null;

   const location = useLocation();

   // Check if current route matches link path
   const isActiveLink = (path: string) => location.pathname === path;

   // Determine link styling based on mobile/desktop view
   const linkClass = isMobile
      ? "block px-3 py-2 rounded-md text-lg font-medium" // Increased text size
      : "px-3 py-2 rounded-md text-lg font-medium"; // Increased text size

   const activeLinkClass =
      "bg-gray-200/70 dark:bg-gray-800/70 text-gray-900 dark:text-white";
   const inactiveLinkClass =
      "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-white";

   return (
      <>
         {/* Authenticated navigation links */}
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
               isActiveLink("/activity") ? activeLinkClass : inactiveLinkClass
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
   );
};

export default NavLinks;
