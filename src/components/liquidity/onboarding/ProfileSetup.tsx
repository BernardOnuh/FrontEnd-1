import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { usePrivy } from "@privy-io/react-auth";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import FormInput from "../common/FormInput";
import { FaUser, FaEnvelope } from "react-icons/fa";

// Validation schema
const ProfileSchema = Yup.object().shape({
   fullName: Yup.string()
      .min(2, "Name is too short")
      .max(50, "Name is too long")
      .required("Full name is required"),
   username: Yup.string()
      .min(3, "Username is too short")
      .max(20, "Username is too long")
      .matches(
         /^[a-zA-Z0-9_]+$/,
         "Username can only contain letters, numbers and underscores"
      )
      .required("Username is required"),
   email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
});

const ProfileSetup: React.FC = () => {
   const { onboardingData, updateOnboardingData, updateOnboardingStep } =
      useLiquidity();
   const { user } = usePrivy();

   // Extract user data from Privy if available
   const userEmail = user?.email?.address || "";
   const extractedUsername = userEmail ? userEmail.split("@")[0] : "";

   // Initial form values
   const initialValues = {
      fullName: onboardingData.profile?.fullName || "",
      username: onboardingData.profile?.username || extractedUsername,
      email: onboardingData.profile?.email || userEmail,
   };

   // Handle form submission
   const handleSubmit = (values: typeof initialValues) => {
      updateOnboardingData({
         profile: values,
      });

      // Move to next step
      updateOnboardingStep("KYC_VERIFICATION");
   };

   // Handle back button
   const handleBack = () => {
      updateOnboardingStep("ROLE_SELECTION");
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Set Up Your Profile
            </h2>
            <p className="mt-2 text-gray-600">
               Please provide your basic information to continue
            </p>
         </div>

         <Formik
            initialValues={initialValues}
            validationSchema={ProfileSchema}
            onSubmit={handleSubmit}>
            {({ isValid, dirty, isSubmitting, submitForm }) => (
               <Form className="space-y-6">
                  <FormInput
                     label="Full Name"
                     name="fullName"
                     placeholder="Enter your full name"
                     required
                     icon={<FaUser />}
                  />

                  <FormInput
                     label="Username"
                     name="username"
                     placeholder="Choose a username"
                     required
                     icon="@"
                     hint="Your username will be visible to other users on the platform"
                  />

                  <FormInput
                     label="Email Address"
                     name="email"
                     type="email"
                     placeholder="Enter your email address"
                     required
                     icon={<FaEnvelope />}
                     hint="We'll use this email for important notifications"
                  />

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                     <div className="flex">
                        <div className="flex-shrink-0 text-yellow-500">
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
                              Make sure your information is accurate. This will
                              be verified in the next step.
                           </p>
                        </div>
                     </div>
                  </div>

                  <NavigationButtons
                     onNext={submitForm}
                     onBack={handleBack}
                     nextDisabled={!(isValid && dirty) || isSubmitting}
                     loading={isSubmitting}
                     nextLabel="Continue"
                  />
               </Form>
            )}
         </Formik>
      </div>
   );
};

export default ProfileSetup;
