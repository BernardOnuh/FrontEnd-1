import { IoWalletSharp } from "react-icons/io5";

interface WalletInfoProps {
   balance: string;
}

const WalletInfo: React.FC<WalletInfoProps> = ({ balance }) => {
   return (
      <div className="hidden sm:flex items-center bg-gray-100/80 dark:bg-gray-800/80 px-3 py-2 rounded-lg mr-2 backdrop-blur-sm">
         <IoWalletSharp className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />{" "}
         {/* Increased size */}
         <span className="text-base font-medium">${balance}</span>{" "}
         {/* Increased text size */}
         <span className="text-base ml-1 text-gray-500 dark:text-gray-400">
            ↓
         </span>{" "}
         {/* Increased text size */}
      </div>
   );
};

export default WalletInfo;
