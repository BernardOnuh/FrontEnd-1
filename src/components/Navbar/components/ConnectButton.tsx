import { MdArrowOutward } from "react-icons/md";
import { motion } from "framer-motion";

interface ConnectButtonProps {
   onClick: () => void;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ onClick }) => {
   return (
      <motion.button
         onClick={onClick}
         whileHover={{ scale: 1.03 }}
         whileTap={{ scale: 0.97 }}
         className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 
         text-white font-medium py-2 px-4 sm:px-6 text-lg whitespace-nowrap rounded-full flex items-center w-auto">
         {" "}
         {/* Increased text size */}
         <MdArrowOutward className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />{" "}
         {/* Increased size */}
         <span className="truncate">Launch App</span>
      </motion.button>
   );
};

export default ConnectButton;
