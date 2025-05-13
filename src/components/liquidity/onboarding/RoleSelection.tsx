import React from "react";
import { LiquidityRole } from "../../../types/LiquidityTypes";
import { useLiquidity } from "../../../context/LiquidityContext";
import NavigationButtons from "../common/NavigationButtons";
import {
   FaCoins,
   FaDollarSign,
   FaArrowRight,
   FaArrowLeft,
} from "react-icons/fa";

const RoleSelection: React.FC = () => {
   const { onboardingData, updateOnboardingData, updateOnboardingStep } =
      useLiquidity();
   const selectedRole = onboardingData.role;

   // Handle role selection
   const handleRoleSelect = (role: LiquidityRole) => {
      updateOnboardingData({ role });
   };

   // Move to next step
   const handleNext = () => {
      if (selectedRole) {
         updateOnboardingStep("PROFILE_SETUP");
      }
   };

   // Create card for each role
   const RoleCard: React.FC<{
      role: LiquidityRole;
      title: string;
      description: string;
      icon: React.ReactNode;
      isSelected: boolean;
   }> = ({ role, title, description, icon, isSelected }) => (
      <div
         className={`
        relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-300
        ${
           isSelected
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
        }
      `}
         onClick={() => handleRoleSelect(role)}>
         <div className="flex items-start">
            <div
               className={`
            p-3 rounded-full mr-4
            ${
               isSelected
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-500"
            }
          `}>
               {icon}
            </div>
            <div>
               <h3 className="text-lg font-medium mb-2">{title}</h3>
               <p className="text-gray-600">{description}</p>
            </div>
         </div>

         {isSelected && (
            <div className="absolute top-4 right-4 text-purple-600">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                     fillRule="evenodd"
                     d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                     clipRule="evenodd"
                  />
               </svg>
            </div>
         )}
      </div>
   );

   return (
      <div className="max-w-2xl mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Choose Your Liquidity Provider Role
            </h2>
            <p className="mt-2 text-gray-600">
               Select how you want to provide liquidity to the platform
            </p>
         </div>

         <div className="grid grid-cols-1 gap-6 mb-8">
            <RoleCard
               role="CRYPTO_TO_FIAT"
               title="Crypto to Fiat Provider"
               description="Provide USDC liquidity and earn returns in NGN. Help users convert their crypto to local currency."
               icon={<FaCoins className="w-5 h-5" />}
               isSelected={selectedRole === "CRYPTO_TO_FIAT"}
            />

            <div className="flex justify-center items-center py-2">
               <div className="border-t border-gray-200 w-1/3"></div>
               <div className="px-4 text-gray-500">or</div>
               <div className="border-t border-gray-200 w-1/3"></div>
            </div>

            <RoleCard
               role="FIAT_TO_CRYPTO"
               title="Fiat to Crypto Provider"
               description="Provide NGN liquidity and earn returns in USDC. Help users convert their local currency to crypto."
               icon={<FaDollarSign className="w-5 h-5" />}
               isSelected={selectedRole === "FIAT_TO_CRYPTO"}
            />
         </div>

         <div className="flex flex-col items-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full">
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
                        As a liquidity provider, you'll earn fees from trades
                        made on the platform. The more liquidity you provide,
                        the more you can earn.
                     </p>
                  </div>
               </div>
            </div>

            <NavigationButtons
               onNext={handleNext}
               nextDisabled={!selectedRole}
               nextLabel="Continue"
               hideBack
            />
         </div>
      </div>
   );
};

export default RoleSelection;
