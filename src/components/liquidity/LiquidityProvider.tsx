import React, { useEffect } from "react";
import { useLiquidity } from "../../context/LiquidityContext";
import { ProcessStep } from "../../types/LiquidityTypes";
import ProgressStepper from "./common/ProgressStepper";

// Onboarding steps
import RoleSelection from "./onboarding/RoleSelection";
import ProfileSetup from "./onboarding/ProfileSetup";
import KYCVerification from "./onboarding/KYCVerification";
import WalletFunding from "./onboarding/WalletFunding";
import VirtualAccountFunding from "./onboarding/VirtualAccountFunding";
import BankDetails from "./onboarding/BankDetails";
import CryptoDestination from "./onboarding/CryptoDestination";
import SuccessConfirmation from "./onboarding/SuccessConfirmation";

const LiquidityProvider: React.FC = () => {
   const { onboardingData, resetOnboarding } = useLiquidity();

   // Reset onboarding when component mounts
   useEffect(() => {
      resetOnboarding();
   }, [resetOnboarding]);

   // Define the steps for each flow
   const getCryptoToFiatSteps = () => [
      { step: "ROLE_SELECTION" as ProcessStep, label: "Role" },
      { step: "PROFILE_SETUP" as ProcessStep, label: "Profile" },
      { step: "KYC_VERIFICATION" as ProcessStep, label: "KYC" },
      { step: "WALLET_FUNDING" as ProcessStep, label: "Funding" },
      { step: "BANK_DETAILS" as ProcessStep, label: "Bank Details" },
      { step: "CONFIRMATION" as ProcessStep, label: "Confirmation" },
   ];

   const getFiatToCryptoSteps = () => [
      { step: "ROLE_SELECTION" as ProcessStep, label: "Role" },
      { step: "PROFILE_SETUP" as ProcessStep, label: "Profile" },
      { step: "KYC_VERIFICATION" as ProcessStep, label: "KYC" },
      { step: "VIRTUAL_ACCOUNT_FUNDING" as ProcessStep, label: "Funding" },
      { step: "CRYPTO_DESTINATION" as ProcessStep, label: "Wallet" },
      { step: "CONFIRMATION" as ProcessStep, label: "Confirmation" },
   ];

   // Get current steps based on selected role
   const getSteps = () => {
      if (!onboardingData.role || onboardingData.role === "CRYPTO_TO_FIAT") {
         return getCryptoToFiatSteps();
      } else {
         return getFiatToCryptoSteps();
      }
   };

   // Render current step component
   const renderStepComponent = () => {
      const { currentStep, role } = onboardingData;

      switch (currentStep) {
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
            return <RoleSelection />;
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
