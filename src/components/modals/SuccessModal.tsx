import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { HiExternalLink } from "react-icons/hi";

interface SuccessModalProps {
   isOpen: boolean;
   onClose: () => void;
   isSuccess: boolean;
   transactionId?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
   isOpen,
   onClose,
   isSuccess,
   transactionId,
}) => {
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
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl text-center"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Success/Error Icon */}
                  <div className="mb-4">
                     {isSuccess ? (
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                           <FaCheckCircle
                              className="text-green-600 dark:text-green-400"
                              size={40}
                           />
                        </div>
                     ) : (
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                           <FaTimesCircle
                              className="text-red-600 dark:text-red-400"
                              size={40}
                           />
                        </div>
                     )}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                     {isSuccess
                        ? "Transaction Successful!"
                        : "Transaction Failed"}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                     {isSuccess
                        ? "Your swap has been processed successfully. The funds will be sent to your bank account shortly."
                        : "Something went wrong while processing your transaction. Please try again or contact support."}
                  </p>

                  {/* Transaction Details */}
                  {isSuccess && transactionId && (
                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                           <div className="text-left">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                 Transaction ID
                              </p>
                              <p className="font-mono text-sm text-gray-900 dark:text-white">
                                 {transactionId}
                              </p>
                           </div>
                           <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">
                              <HiExternalLink size={20} />
                           </button>
                        </div>
                     </div>
                  )}

                  {/* Action Button */}
                  <button
                     onClick={onClose}
                     className={`w-full px-4 py-3 rounded-lg font-medium text-white transition-colors ${
                        isSuccess
                           ? "bg-purple-600 hover:bg-purple-700"
                           : "bg-gray-600 hover:bg-gray-700"
                     }`}>
                     {isSuccess ? "Done" : "Close"}
                  </button>

                  {/* Additional Help */}
                  {!isSuccess && (
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Need help?{" "}
                        <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium">
                           Contact Support
                        </button>
                     </p>
                  )}
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default SuccessModal;
