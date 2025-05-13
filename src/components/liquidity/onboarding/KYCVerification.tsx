import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import FormInput from "../common/FormInput";
import {
   VerificationType,
   VerificationStatus,
} from "../../../types/LiquidityTypes";
import { FaIdCard, FaCheck, FaTimes, FaClock } from "react-icons/fa";

// Validation schema
const KYCSchema = Yup.object().shape({
   verificationType: Yup.string()
      .oneOf(
         ["BVN", "NIN"] as VerificationType[],
         "Please select a valid verification type"
      )
      .required("Verification type is required"),
   verificationId: Yup.string()
      .matches(/^[0-9]+$/, "Must contain only numbers")
      .length(11, "Must be exactly 11 digits")
      .required("Verification ID is required"),
});

const KYCVerification: React.FC = () => {
   const {
      onboardingData,
      updateOnboardingData,
      updateOnboardingStep,
      verifyKYC,
   } = useLiquidity();
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Initial form values
   const initialValues = {
      verificationType:
         onboardingData.kyc?.verificationType || ("BVN" as VerificationType),
      verificationId: onboardingData.kyc?.verificationId || "",
   };

   // Handle form submission
   const handleSubmit = async (values: typeof initialValues) => {
      setLoading(true);
      setError(null);

      try {
         const success = await verifyKYC(
            values.verificationType,
            values.verificationId
         );

         if (success) {
            // Move to next step based on selected role
            if (onboardingData.role === "CRYPTO_TO_FIAT") {
               updateOnboardingStep("WALLET_FUNDING");
            } else {
               updateOnboardingStep("VIRTUAL_ACCOUNT_FUNDING");
            }
         } else {
            setError(
               "Verification failed. Please check your details and try again."
            );
         }
      } catch (err) {
         setError("An error occurred during verification. Please try again.");
         console.error("KYC verification error:", err);
      } finally {
         setLoading(false);
      }
   };

   // Handle back button
   const handleBack = () => {
      updateOnboardingStep("PROFILE_SETUP");
   };

   // Render status badge
   const StatusBadge: React.FC<{ status: VerificationStatus }> = ({
      status,
   }) => {
      if (status === "PENDING") {
         return (
            <div className="flex items-center text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
               <FaClock className="mr-1" />
               <span>Verification in progress...</span>
            </div>
         );
      } else if (status === "APPROVED") {
         return (
            <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
               <FaCheck className="mr-1" />
               <span>Verification successful</span>
            </div>
         );
      } else {
         return (
            <div className="flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full">
               <FaTimes className="mr-1" />
               <span>Verification failed</span>
            </div>
         );
      }
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Identity Verification
            </h2>
            <p className="mt-2 text-gray-600">
               Please verify your identity to continue
            </p>
         </div>

         {onboardingData.kyc?.status ? (
            <div className="text-center mb-8">
               <StatusBadge status={onboardingData.kyc.status} />

               {onboardingData.kyc.status === "APPROVED" && (
                  <div className="mt-4">
                     <p className="text-green-700">
                        Your identity has been verified successfully!
                     </p>
                     <button
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        onClick={() => {
                           if (onboardingData.role === "CRYPTO_TO_FIAT") {
                              updateOnboardingStep("WALLET_FUNDING");
                           } else {
                              updateOnboardingStep("VIRTUAL_ACCOUNT_FUNDING");
                           }
                        }}>
                        Continue
                     </button>
                  </div>
               )}

               {onboardingData.kyc.status === "REJECTED" && (
                  <div className="mt-4">
                     <p className="text-red-700">
                        Verification failed. Please try again with correct
                        information.
                     </p>
                     <button
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        onClick={() => {
                           updateOnboardingData({
                              kyc: undefined,
                           });
                        }}>
                        Try Again
                     </button>
                  </div>
               )}
            </div>
         ) : (
            <Formik
               initialValues={initialValues}
               validationSchema={KYCSchema}
               onSubmit={handleSubmit}>
               {({ isValid, dirty, values, setFieldValue, submitForm }) => (
                  <Form className="space-y-6">
                     <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                           Verification Method
                           <span className="text-red-500 ml-1">*</span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                           <div
                              className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${
                         values.verificationType === "BVN"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-300 hover:border-purple-400"
                      }
                    `}
                              onClick={() =>
                                 setFieldValue("verificationType", "BVN")
                              }>
                              <div className="flex items-center">
                                 <div
                                    className={`
                        w-5 h-5 rounded-full border flex items-center justify-center mr-3
                        ${
                           values.verificationType === "BVN"
                              ? "border-purple-600"
                              : "border-gray-400"
                        }
                      `}>
                                    {values.verificationType === "BVN" && (
                                       <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                    )}
                                 </div>
                                 <div>
                                    <h3 className="font-medium">BVN</h3>
                                    <p className="text-sm text-gray-500">
                                       Bank Verification Number
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div
                              className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${
                         values.verificationType === "NIN"
                            ? "border-purple-600 bg-purple-50"
                            : "border-gray-300 hover:border-purple-400"
                      }
                    `}
                              onClick={() =>
                                 setFieldValue("verificationType", "NIN")
                              }>
                              <div className="flex items-center">
                                 <div
                                    className={`
                        w-5 h-5 rounded-full border flex items-center justify-center mr-3
                        ${
                           values.verificationType === "NIN"
                              ? "border-purple-600"
                              : "border-gray-400"
                        }
                      `}>
                                    {values.verificationType === "NIN" && (
                                       <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                    )}
                                 </div>
                                 <div>
                                    <h3 className="font-medium">NIN</h3>
                                    <p className="text-sm text-gray-500">
                                       National Identity Number
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <FormInput
                        label={
                           values.verificationType === "BVN" ? "BVN" : "NIN"
                        }
                        name="verificationId"
                        placeholder={`Enter your ${values.verificationType}`}
                        required
                        maxLength={11}
                        icon={<FaIdCard />}
                        hint={`Your ${values.verificationType} should be 11 digits. We use this to verify your identity.`}
                     />

                     {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                           <div className="flex">
                              <div className="flex-shrink-0 text-red-500">
                                 <FaTimes className="h-5 w-5" />
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
                                 Your information is secure and will only be
                                 used for verification purposes. We do not store
                                 your {values.verificationType} after
                                 verification.
                              </p>
                           </div>
                        </div>
                     </div>

                     <NavigationButtons
                        onNext={submitForm}
                        onBack={handleBack}
                        nextDisabled={!(isValid && dirty) || loading}
                        loading={loading}
                        nextLabel="Verify Identity"
                     />
                  </Form>
               )}
            </Formik>
         )}
      </div>
   );
};

export default KYCVerification;
