import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaEthereum, FaDollarSign } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import { SwapDetails } from "../../context/SwapContext";

interface ConfirmSwapModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   swapDetails: SwapDetails | null;
}

const ConfirmSwapModal: React.FC<ConfirmSwapModalProps> = ({
   isOpen,
   onClose,
   onConfirm,
   swapDetails,
}) => {
   if (!swapDetails) return null;

   return (
      <AnimatePresence>
         {isOpen && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
               onClick={onClose}>
               <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Transaction Details
                     </h2>
                     <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <IoClose size={24} />
                     </button>
                  </div>

                  {/* Swap Details */}
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                           <FaEthereum
                              className="text-blue-600 dark:text-blue-400"
                              size={24}
                           />
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                              From
                           </p>
                           <p className="font-semibold text-gray-900 dark:text-white">
                              {swapDetails.fromAmount} {swapDetails.fromToken}
                           </p>
                        </div>
                     </div>

                     <HiArrowRight className="text-gray-400" size={24} />

                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                           <FaDollarSign
                              className="text-green-600 dark:text-green-400"
                              size={24}
                           />
                        </div>
                        <div className="text-right">
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                              To
                           </p>
                           <p className="font-semibold text-gray-900 dark:text-white">
                              {swapDetails.toAmount} {swapDetails.toToken}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Exchange Rate */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                           Exchange Rate
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                           1 {swapDetails.fromToken} = {swapDetails.rate}{" "}
                           {swapDetails.toToken}
                        </span>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                     <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                     </button>
                     <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors">
                        Confirm Swap
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default ConfirmSwapModal;
