import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import FormInput from "../common/FormInput";
import { FaWallet, FaExclamationTriangle } from "react-icons/fa";

// Validation schema
const WalletSchema = Yup.object().shape({
   address: Yup.string()
      .matches(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address")
      .required("Wallet address is required"),
   useConnectedWallet: Yup.boolean(),
});

const CryptoDestination: React.FC = () => {
   const {
      onboardingData,
      updateOnboardingData,
      updateOnboardingStep,
      walletAddress,
   } = useLiquidity();

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Initial form values
   const initialValues = {
      address: onboardingData.cryptoDestination?.address || walletAddress || "",
      useConnectedWallet:
         onboardingData.cryptoDestination?.isConnectedWallet || true,
   };

   // Handle form submission
   const handleSubmit = (values: typeof initialValues) => {
      setLoading(true);
      setError(null);

      try {
         updateOnboardingData({
            cryptoDestination: {
               address: values.useConnectedWallet
                  ? walletAddress || ""
                  : values.address,
               isConnectedWallet: values.useConnectedWallet,
            },
         });

         // Move to confirmation step
         updateOnboardingStep("CONFIRMATION");
      } catch (err) {
         setError("Failed to save wallet details. Please try again.");
         console.error("Crypto destination error:", err);
      } finally {
         setLoading(false);
      }
   };

   // Handle back button
   const handleBack = () => {
      updateOnboardingStep("VIRTUAL_ACCOUNT_FUNDING");
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Crypto Destination
            </h2>
            <p className="mt-2 text-gray-600">
               Specify where you want to receive your USDC returns
            </p>
         </div>

         <Formik
            initialValues={initialValues}
            validationSchema={WalletSchema}
            onSubmit={handleSubmit}>
            {({ isValid, dirty, values, setFieldValue, submitForm }) => (
               <Form className="space-y-6">
                  <div className="space-y-4">
                     <div className="flex items-center">
                        <input
                           id="useConnectedWallet"
                           name="useConnectedWallet"
                           type="checkbox"
                           className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                           checked={values.useConnectedWallet}
                           onChange={(e) => {
                              setFieldValue(
                                 "useConnectedWallet",
                                 e.target.checked
                              );
                              if (e.target.checked && walletAddress) {
                                 setFieldValue("address", walletAddress);
                              }
                           }}
                        />
                        <label
                           htmlFor="useConnectedWallet"
                           className="ml-2 block text-sm text-gray-700">
                           Use my connected wallet
                        </label>
                     </div>

                     {walletAddress && values.useConnectedWallet && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                           <div className="flex items-center">
                              <FaWallet className="text-purple-600 mr-2" />
                              <div>
                                 <p className="text-sm font-medium text-gray-700">
                                    Connected Wallet
                                 </p>
                                 <p className="text-xs text-gray-500 break-all">
                                    {walletAddress}
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {!values.useConnectedWallet && (
                     <FormInput
                        label="Wallet Address"
                        name="address"
                        placeholder="Enter your Ethereum address (0x...)"
                        required
                        icon={<FaWallet />}
                        hint="This is where you'll receive your USDC returns"
                     />
                  )}

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

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                     <div className="flex">
                        <div className="flex-shrink-0 text-yellow-600">
                           <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor">
                              <path
                                 fillRule="evenodd"
                                 d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                 clipRule="evenodd"
                              />
                           </svg>
                        </div>
                        <div className="ml-3 text-sm text-yellow-800">
                           <p>
                              Make sure the wallet address is correct.
                              Transactions on the blockchain cannot be reversed
                              once they are confirmed.
                           </p>
                        </div>
                     </div>
                  </div>

                  <NavigationButtons
                     onNext={submitForm}
                     onBack={handleBack}
                     nextDisabled={
                        !(isValid && (dirty || walletAddress)) || loading
                     }
                     loading={loading}
                     nextLabel="Continue"
                  />
               </Form>
            )}
         </Formik>
      </div>
   );
};

export default CryptoDestination;
