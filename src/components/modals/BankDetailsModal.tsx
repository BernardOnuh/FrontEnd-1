import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { BankDetails } from "../../context/SwapContext";

interface BankDetailsModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSubmit: (details: BankDetails) => void;
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
   isOpen,
   onClose,
   onSubmit,
}) => {
   const [formData, setFormData] = useState<BankDetails>({
      accountName: "",
      accountNumber: "",
      bankName: "",
      routingNumber: "",
      swiftCode: "",
      bankAddress: "",
      bankCountry: "",
      accountType: "savings",
   });

   const [errors, setErrors] = useState<Partial<BankDetails>>({});

   const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
   ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error when user starts typing
      if (errors[name as keyof BankDetails]) {
         setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
   };

   const validateForm = (): boolean => {
      const newErrors: Partial<BankDetails> = {};

      if (!formData.accountName.trim())
         newErrors.accountName = "Account name is required";
      if (!formData.accountNumber.trim())
         newErrors.accountNumber = "Account number is required";
      if (!formData.bankName.trim())
         newErrors.bankName = "Bank name is required";
      if (!formData.routingNumber.trim())
         newErrors.routingNumber = "Routing number is required";
      if (!formData.bankCountry.trim())
         newErrors.bankCountry = "Bank country is required";

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
         onSubmit(formData);
      }
   };

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
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Bank Details
                     </h2>
                     <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <IoClose size={24} />
                     </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Account Name */}
                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Account Name
                           </label>
                           <input
                              type="text"
                              name="accountName"
                              value={formData.accountName}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-lg border ${
                                 errors.accountName
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              placeholder="Enter your full name"
                           />
                           {errors.accountName && (
                              <p className="text-red-500 text-sm mt-1">
                                 {errors.accountName}
                              </p>
                           )}
                        </div>

                        {/* Account Number */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Account Number
                           </label>
                           <input
                              type="text"
                              name="accountNumber"
                              value={formData.accountNumber}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-lg border ${
                                 errors.accountNumber
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              placeholder="Enter account number"
                           />
                           {errors.accountNumber && (
                              <p className="text-red-500 text-sm mt-1">
                                 {errors.accountNumber}
                              </p>
                           )}
                        </div>

                        {/* Account Type */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Account Type
                           </label>
                           <select
                              name="accountType"
                              value={formData.accountType}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                              <option value="savings">Savings</option>
                              <option value="checking">Checking</option>
                           </select>
                        </div>

                        {/* Bank Name */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Bank Name
                           </label>
                           <input
                              type="text"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-lg border ${
                                 errors.bankName
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              placeholder="Enter bank name"
                           />
                           {errors.bankName && (
                              <p className="text-red-500 text-sm mt-1">
                                 {errors.bankName}
                              </p>
                           )}
                        </div>

                        {/* Routing Number */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Routing Number
                           </label>
                           <input
                              type="text"
                              name="routingNumber"
                              value={formData.routingNumber}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-lg border ${
                                 errors.routingNumber
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              placeholder="Enter routing number"
                           />
                           {errors.routingNumber && (
                              <p className="text-red-500 text-sm mt-1">
                                 {errors.routingNumber}
                              </p>
                           )}
                        </div>

                        {/* SWIFT Code (Optional) */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              SWIFT Code (Optional)
                           </label>
                           <input
                              type="text"
                              name="swiftCode"
                              value={formData.swiftCode}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter SWIFT code"
                           />
                        </div>

                        {/* Bank Country */}
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Bank Country
                           </label>
                           <input
                              type="text"
                              name="bankCountry"
                              value={formData.bankCountry}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-lg border ${
                                 errors.bankCountry
                                    ? "border-red-500"
                                    : "border-gray-300 dark:border-gray-600"
                              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                              placeholder="Enter bank country"
                           />
                           {errors.bankCountry && (
                              <p className="text-red-500 text-sm mt-1">
                                 {errors.bankCountry}
                              </p>
                           )}
                        </div>

                        {/* Bank Address (Optional) */}
                        <div className="col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Bank Address (Optional)
                           </label>
                           <input
                              type="text"
                              name="bankAddress"
                              value={formData.bankAddress}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="Enter bank address"
                           />
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-3 pt-4">
                        <button
                           type="button"
                           onClick={onClose}
                           className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                           Cancel
                        </button>
                        <button
                           type="submit"
                           className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-white transition-colors">
                           Continue
                        </button>
                     </div>
                  </form>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};

export default BankDetailsModal;
