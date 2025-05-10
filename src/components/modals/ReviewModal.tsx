import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaCheckCircle, FaExchangeAlt } from "react-icons/fa";
import { SwapDetails, BankDetails } from "../../context/SwapContext";

interface ReviewModalProps {
   isOpen: boolean;
   onClose: () => void;
   onConfirm: () => void;
   swapDetails: SwapDetails | null;
   bankDetails: BankDetails | null;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
   isOpen,
   onClose,
   onConfirm,
   swapDetails,
   bankDetails,
}) => {
   if (!swapDetails || !bankDetails) return null;

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
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Review Transaction
                     </h2>
                     <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <IoClose size={24} />
                     </button>
                  </div>

                  {/* Swap Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                     <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Swap Details
                     </h3>
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                              You send
                           </p>
                           <p className="font-semibold text-gray-900 dark:text-white">
                              {swapDetails.fromAmount} {swapDetails.fromToken}
                           </p>
                        </div>
                     </div>
                     <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
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
                  </div>

                  {/* Bank Details Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                     <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Receiving Bank Details
                     </h3>
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-gray-400">
                              Account Name
                           </span>
                           <span className="font-medium text-gray-900 dark:text-white">
                              {bankDetails.accountName}
                           </span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-gray-400">
                              Account Number
                           </span>
                           <span className="font-medium text-gray-900 dark:text-white">
                              {bankDetails.accountNumber}
                           </span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-gray-400">
                              Bank Name
                           </span>
                           <span className="font-medium text-gray-900 dark:text-white">
                              {bankDetails.bankName}
                           </span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-gray-400">
                              Routing Number
                           </span>
                           <span className="font-medium text-gray-900 dark:text-white">
                              {bankDetails.routingNumber}
                           </span>
                        </div>
                        {bankDetails.swiftCode && (
                           <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                 SWIFT Code
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                 {bankDetails.swiftCode}
                              </span>
                           </div>
                        )}
                        <div className="flex justify-between text-sm">
                           <span className="text-gray-600 dark:text-gray-400">
                              Account Type
                           </span>
                           <span className="font-medium text-gray-900 dark:text-white capitalize">
                              {bankDetails.accountType}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Confirmation Notice */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                     <div className="flex items-start gap-3">
                        <FaCheckCircle className="text-green-600 dark:text-green-400 mt-1" />
                        <div className="text-sm text-green-800 dark:text-green-300">
                           <p className="font-medium mb-1">
                              Please confirm your details
                           </p>
                           <p>
                              Once you confirm, the transaction will be
                              processed and cannot be reversed.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                     <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Go Back
                     </button>
                     <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors">
                        Confirm & Submit
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default ReviewModal;
