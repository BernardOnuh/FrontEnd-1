import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import FormInput from "../common/FormInput";
import {
   FaUniversity,
   FaUser,
   FaHashtag,
   FaExclamationTriangle,
   FaCheckCircle,
} from "react-icons/fa";

// List of Nigerian banks
const nigeriaBanks = [
   "Access Bank",
   "Fidelity Bank",
   "First Bank of Nigeria",
   "First City Monument Bank",
   "Guaranty Trust Bank",
   "Zenith Bank",
   "United Bank for Africa",
   "Union Bank of Nigeria",
   "Sterling Bank",
   "Stanbic IBTC Bank",
   "Providus Bank",
   "Polaris Bank",
   "Wema Bank",
   "Unity Bank",
   "Keystone Bank",
];

// Validation schema
const BankSchema = Yup.object().shape({
   accountNumber: Yup.string()
      .matches(/^[0-9]+$/, "Must contain only numbers")
      .length(10, "Must be exactly 10 digits")
      .required("Account number is required"),
   bankName: Yup.string().required("Bank name is required"),
   accountName: Yup.string()
      .min(2, "Too short")
      .max(100, "Too long")
      .required("Account name is required"),
});

const BankDetails: React.FC = () => {
   const {
      onboardingData,
      updateOnboardingData,
      updateOnboardingStep,
      verifyBankAccount,
   } = useLiquidity();

   const [loading, setLoading] = useState(false);
   const [verifying, setVerifying] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [verified, setVerified] = useState(
      !!onboardingData.bankDetails?.verified
   );

   // Initial form values
   const initialValues = {
      accountNumber: onboardingData.bankDetails?.accountNumber || "",
      bankName: onboardingData.bankDetails?.bankName || "",
      accountName: onboardingData.bankDetails?.accountName || "",
   };

   // Verify account number
   const handleVerifyAccount = async (
      accountNumber: string,
      bankName: string
   ) => {
      if (accountNumber.length !== 10 || !/^[0-9]+$/.test(accountNumber)) {
         setError("Account number must be 10 digits");
         return;
      }

      setVerifying(true);
      setError(null);

      try {
         const success = await verifyBankAccount(accountNumber, bankName);

         if (success) {
            setVerified(true);
         } else {
            setError(
               "Account verification failed. Please check your details and try again."
            );
         }
      } catch (err) {
         setError("An error occurred during verification. Please try again.");
         console.error("Bank verification error:", err);
      } finally {
         setVerifying(false);
      }
   };

   // Handle form submission
   const handleSubmit = (values: typeof initialValues) => {
      setLoading(true);
      setError(null);

      try {
         updateOnboardingData({
            bankDetails: {
               accountNumber: values.accountNumber,
               bankName: values.bankName,
               accountName: values.accountName,
               isDefault: true,
               verified: true,
            },
         });

         // Move to confirmation step
         updateOnboardingStep("CONFIRMATION");
      } catch (err) {
         setError("Failed to save bank details. Please try again.");
         console.error("Bank details error:", err);
      } finally {
         setLoading(false);
      }
   };

   // Handle back button
   const handleBack = () => {
      updateOnboardingStep("WALLET_FUNDING");
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Bank Account Details
            </h2>
            <p className="mt-2 text-gray-600">
               Provide your bank account details to receive returns
            </p>
         </div>

         <Formik
            initialValues={initialValues}
            validationSchema={BankSchema}
            onSubmit={handleSubmit}
            enableReinitialize>
            {({ isValid, dirty, values, setFieldValue, submitForm }) => (
               <Form className="space-y-6">
                  <div className="space-y-2">
                     <label
                        htmlFor="bankName"
                        className="block text-sm font-medium text-gray-700">
                        Bank Name
                        <span className="text-red-500 ml-1">*</span>
                     </label>

                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <FaUniversity className="text-gray-400" />
                        </div>
                        <select
                           id="bankName"
                           name="bankName"
                           className="block w-full pl-10 pr-10 py-2 rounded-md focus:ring-purple-500 focus:border-purple-500 border-gray-300"
                           value={values.bankName}
                           onChange={(e) => {
                              setFieldValue("bankName", e.target.value);
                              setVerified(false);
                           }}>
                           <option value="">Select a bank</option>
                           {nigeriaBanks.map((bank) => (
                              <option key={bank} value={bank}>
                                 {bank}
                              </option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label
                           htmlFor="accountNumber"
                           className="block text-sm font-medium text-gray-700">
                           Account Number
                           <span className="text-red-500 ml-1">*</span>
                        </label>

                        {!verified &&
                           values.accountNumber.length === 10 &&
                           values.bankName && (
                              <button
                                 type="button"
                                 className="text-sm text-purple-600 hover:text-purple-800"
                                 onClick={() =>
                                    handleVerifyAccount(
                                       values.accountNumber,
                                       values.bankName
                                    )
                                 }
                                 disabled={verifying}>
                                 {verifying ? "Verifying..." : "Verify Account"}
                              </button>
                           )}
                     </div>

                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <FaHashtag className="text-gray-400" />
                        </div>
                        <input
                           type="text"
                           id="accountNumber"
                           name="accountNumber"
                           maxLength={10}
                           className="block w-full pl-10 py-2 rounded-md focus:ring-purple-500 focus:border-purple-500 border-gray-300"
                           placeholder="Enter 10-digit account number"
                           value={values.accountNumber}
                           onChange={(e) => {
                              const numericalValue = e.target.value.replace(
                                 /[^0-9]/g,
                                 ""
                              );
                              setFieldValue("accountNumber", numericalValue);
                              setVerified(false);
                           }}
                        />

                        {verified && (
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-green-500">
                              <FaCheckCircle />
                           </div>
                        )}
                     </div>
                     <p className="mt-1 text-xs text-gray-500">
                        Enter your 10-digit Nigerian bank account number
                     </p>
                  </div>

                  <FormInput
                     label="Account Name"
                     name="accountName"
                     placeholder="Enter account holder name"
                     required
                     disabled={!verified}
                     icon={<FaUser />}
                     hint="This should match the name on your bank account"
                  />

                  {error && (
                     <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                           <div className="flex-shrink-0 text-red-500">
                              <FaExclamationTriangle className="h-5 w-5" />
                           </div>
                           <div className="ml-3">
                              <p className="text-sm text-red-800">{error}</p>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <div className="flex">
                        <div className="flex-shrink-0 text-blue-500">
                           <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor">
                              <path
                                 fillRule="evenodd"
                                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                                 clipRule="evenodd"
                              />
                           </svg>
                        </div>
                        <div className="ml-3 text-sm text-blue-800">
                           <p>
                              Your bank account details will be used to send
                              your returns in NGN. Make sure the information is
                              accurate and matches your BVN/NIN details.
                           </p>
                        </div>
                     </div>
                  </div>

                  <NavigationButtons
                     onNext={submitForm}
                     onBack={handleBack}
                     nextDisabled={!verified || !(isValid && dirty) || loading}
                     loading={loading}
                     nextLabel="Continue"
                  />
               </Form>
            )}
         </Formik>
      </div>
   );
};

export default BankDetails;
