import React, { useEffect } from "react";
import { useLiquidity } from "../../context/LiquidityContext";
import { ProcessStep } from "../../types/LiquidityTypes";
import ProgressStepper from "./common/ProgressStepper";

// Onboarding steps
import WalletConnection from "./onboarding/WalletConnection";
import RoleSelection from "./onboarding/RoleSelection";
import ProfileSetup from "./onboarding/ProfileSetup";
import KYCVerification from "./onboarding/KYCVerification";
import WalletFunding from "./onboarding/WalletFunding";
import VirtualAccountFunding from "./onboarding/VirtualAccountFunding";
import BankDetails from "./onboarding/BankDetails";
import CryptoDestination from "./onboarding/CryptoDestination";
import SuccessConfirmation from "./onboarding/SuccessConfirmation";

const LiquidityProvider: React.FC = () => {
   const { onboardingData, resetOnboarding, isUserVerified } = useLiquidity();

   // Reset onboarding when component mounts
   useEffect(() => {
      // Set the initial step to wallet connection
      resetOnboarding();
      // Update the onboarding data to start with wallet connection
      onboardingData.currentStep = "WALLET_CONNECTION";
   }, [resetOnboarding]);

   // Get current steps based on selected role and verification status
   const getSteps = () => {
      const steps = [];
      // Add connect wallet step first
      steps.push({
         step: "WALLET_CONNECTION" as ProcessStep,
         label: "Connect",
      });

      // Add role selection
      steps.push({ step: "ROLE_SELECTION" as ProcessStep, label: "Role" });

      // Add profile and KYC steps only if user is not verified
      if (!isUserVerified) {
         steps.push({ step: "PROFILE_SETUP" as ProcessStep, label: "Profile" });
         steps.push({ step: "KYC_VERIFICATION" as ProcessStep, label: "KYC" });
      }

      // Add remaining steps based on role
      if (!onboardingData.role || onboardingData.role === "CRYPTO_TO_FIAT") {
         steps.push({
            step: "WALLET_FUNDING" as ProcessStep,
            label: "Funding",
         });
         steps.push({
            step: "BANK_DETAILS" as ProcessStep,
            label: "Bank Details",
         });
      } else {
         steps.push({
            step: "VIRTUAL_ACCOUNT_FUNDING" as ProcessStep,
            label: "Funding",
         });
         steps.push({
            step: "CRYPTO_DESTINATION" as ProcessStep,
            label: "Wallet",
         });
      }

      // Add confirmation step
      steps.push({
         step: "CONFIRMATION" as ProcessStep,
         label: "Confirmation",
      });

      return steps;
   };

   // Render current step component
   const renderStepComponent = () => {
      const { currentStep, role } = onboardingData;

      switch (currentStep) {
         case "WALLET_CONNECTION":
            return <WalletConnection />;
         case "ROLE_SELECTION":
            return <RoleSelection />;
         case "PROFILE_SETUP":
            return <ProfileSetup />;
         case "KYC_VERIFICATION":
            return <KYCVerification />;
         case "WALLET_FUNDING":
            return <WalletFunding />;
         case "VIRTUAL_ACCOUNT_FUNDING":
            return <VirtualAccountFunding />;
         case "BANK_DETAILS":
            return <BankDetails />;
         case "CRYPTO_DESTINATION":
            return <CryptoDestination />;
         case "CONFIRMATION":
            return role ? <SuccessConfirmation role={role} /> : null;
         default:
            return <WalletConnection />;
      }
   };

   // Get current step index
   const getCurrentStepIndex = () => {
      const steps = getSteps();
      return steps.findIndex(
         (step) => step.step === onboardingData.currentStep
      );
   };

   // Check if progress stepper should be shown
   const showProgressStepper = onboardingData.currentStep !== "CONFIRMATION";

   return (
      <div className="max-w-6xl mx-auto p-4">
         <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
            <h1 className="text-2xl font-bold text-center mb-6">
               Add Liquidity
            </h1>

            {showProgressStepper && getCurrentStepIndex() >= 0 && (
               <div className="mb-8">
                  <ProgressStepper
                     steps={getSteps()}
                     currentStep={onboardingData.currentStep}
                  />
               </div>
            )}

            <div className="py-4">{renderStepComponent()}</div>
         </div>
      </div>
   );
};

export default LiquidityProvider;
