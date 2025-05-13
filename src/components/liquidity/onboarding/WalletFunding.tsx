import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import {
   FaWallet,
   FaCoins,
   FaCheckCircle,
   FaExclamationTriangle,
} from "react-icons/fa";

// Validation schema
const FundingSchema = Yup.object().shape({
   amount: Yup.number()
      .positive("Amount must be positive")
      .min(100, "Minimum amount is 100 USDC")
      .required("Amount is required"),
});

const WalletFunding: React.FC = () => {
   const {
      onboardingData,
      // updateOnboardingData,
      updateOnboardingStep,
      isWalletConnected,
      connectWallet,
      walletAddress,
      fundWallet,
   } = useLiquidity();

   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [fundingComplete, setFundingComplete] = useState(false);

   // Initial form values
   const initialValues = {
      amount: onboardingData.funding?.amount || 100,
   };

   // Connect wallet handler
   const handleConnectWallet = async () => {
      setLoading(true);
      setError(null);

      try {
         await connectWallet();
      } catch (err) {
         setError("Failed to connect wallet. Please try again.");
         console.error("Wallet connection error:", err);
      } finally {
         setLoading(false);
      }
   };

   // Submit funding request
   const handleSubmit = async (values: typeof initialValues) => {
      setLoading(true);
      setError(null);

      try {
         const success = await fundWallet(values.amount);

         if (success) {
            setFundingComplete(true);
         } else {
            setError("Funding failed. Please try again.");
         }
      } catch (err) {
         setError(
            "An error occurred during the funding process. Please try again."
         );
         console.error("Wallet funding error:", err);
      } finally {
         setLoading(false);
      }
   };

   // Move to next step
   const handleContinue = () => {
      updateOnboardingStep("BANK_DETAILS");
   };

   // Handle back button
   const handleBack = () => {
      updateOnboardingStep("KYC_VERIFICATION");
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Fund Your Position
            </h2>
            <p className="mt-2 text-gray-600">
               Provide USDC to your liquidity position
            </p>
         </div>

         {!isWalletConnected ? (
            <div className="text-center border rounded-lg p-8 mb-6">
               <div className="flex justify-center mb-4">
                  <FaWallet className="text-purple-600 text-4xl" />
               </div>
               <h3 className="text-lg font-medium mb-2">Connect your wallet</h3>
               <p className="text-gray-600 mb-6">
                  You need to connect your wallet to proceed with funding your
                  position.
               </p>
               <button
                  type="button"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  onClick={handleConnectWallet}
                  disabled={loading}>
                  {loading ? "Connecting..." : "Connect Wallet"}
               </button>

               {error && (
                  <div className="mt-4 text-red-600">
                     <FaExclamationTriangle className="inline mr-1" />
                     {error}
                  </div>
               )}
            </div>
         ) : fundingComplete || onboardingData.funding?.transactionHash ? (
            <div className="text-center border rounded-lg p-8 mb-6 bg-green-50 border-green-200">
               <div className="flex justify-center mb-4">
                  <FaCheckCircle className="text-green-600 text-4xl" />
               </div>
               <h3 className="text-lg font-medium mb-2">Funding Complete!</h3>
               <p className="text-gray-700 mb-2">
                  You have successfully funded your position with{" "}
                  <span className="font-semibold">
                     {onboardingData.funding?.amount || initialValues.amount}{" "}
                     USDC
                  </span>
                  .
               </p>
               <p className="text-sm text-gray-600 mb-6 break-all">
                  Transaction Hash:{" "}
                  {onboardingData.funding?.transactionHash || "Processing..."}
               </p>
               <button
                  type="button"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  onClick={handleContinue}>
                  Continue
               </button>
            </div>
         ) : (
            <Formik
               initialValues={initialValues}
               validationSchema={FundingSchema}
               onSubmit={handleSubmit}>
               {({ isValid, dirty, submitForm }) => (
                  <Form className="space-y-6">
                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center mb-2">
                           <FaWallet className="text-gray-600 mr-2" />
                           <span className="font-medium">Connected Wallet</span>
                        </div>
                        <p className="text-sm text-gray-600 break-all">
                           {walletAddress}
                        </p>
                     </div>

                     <div className="space-y-2">
                        <label
                           htmlFor="amount"
                           className="block text-sm font-medium text-gray-700">
                           Amount (USDC)
                           <span className="text-red-500 ml-1">*</span>
                        </label>

                        <div className="relative rounded-md shadow-sm">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaCoins className="text-gray-400" />
                           </div>
                           <Field
                              type="number"
                              name="amount"
                              id="amount"
                              className="block w-full pl-10 pr-20 py-2 rounded-md focus:ring-purple-500 focus:border-purple-500 border-gray-300"
                              placeholder="Enter amount"
                              min="100"
                              step="1"
                           />
                           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">
                                 USDC
                              </span>
                           </div>
                        </div>
                        <ErrorMessage
                           name="amount"
                           component="div"
                           className="mt-1 text-sm text-red-600"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                           Minimum amount: 100 USDC
                        </p>
                     </div>

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
                                 Make sure you have enough USDC in your wallet.
                                 The transaction will require approval and gas
                                 fees on the Base network.
                              </p>
                           </div>
                        </div>
                     </div>

                     <NavigationButtons
                        onNext={submitForm}
                        onBack={handleBack}
                        nextDisabled={!(isValid && dirty) || loading}
                        loading={loading}
                        nextLabel="Fund Position"
                     />
                  </Form>
               )}
            </Formik>
         )}
      </div>
   );
};

export default WalletFunding;
