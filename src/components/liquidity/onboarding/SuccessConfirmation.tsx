import React from "react";
import { useNavigate } from "react-router-dom";
import { useLiquidity } from "../../../context/LiquidityContext";
import { LiquidityRole } from "../../../types/LiquidityTypes";
import {
   FaCheckCircle,
   FaDollarSign,
   FaCoins,
   FaArrowRight,
} from "react-icons/fa";

interface SuccessConfirmationProps {
   role: LiquidityRole;
}

const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({ role }) => {
   const { onboardingData, submitLiquidityPosition } = useLiquidity();
   const navigate = useNavigate();

   // Handle finish button click
   const handleFinish = async () => {
      // Submit the liquidity position to the API
      await submitLiquidityPosition();

      // Redirect to the liquidity dashboard
      navigate("/liquidity-dashboard");
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
               <FaCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="mt-2 text-gray-600">
               You have successfully completed the liquidity provider setup.
            </p>
         </div>

         <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="text-lg font-medium mb-4">
               Your Liquidity Provider Details
            </h3>

            <div className="space-y-4">
               <div className="flex items-start">
                  <div
                     className={`
              p-2 rounded-full mr-3 
              ${
                 role === "CRYPTO_TO_FIAT"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-blue-100 text-blue-600"
              }
            `}>
                     {role === "CRYPTO_TO_FIAT" ? (
                        <FaCoins />
                     ) : (
                        <FaDollarSign />
                     )}
                  </div>
                  <div>
                     <p className="font-medium">Role</p>
                     <p className="text-gray-600">
                        {role === "CRYPTO_TO_FIAT"
                           ? "Crypto to Fiat Provider"
                           : "Fiat to Crypto Provider"}
                     </p>
                  </div>
               </div>

               <div className="border-t border-gray-200 pt-4">
                  <p className="font-medium">Amount</p>
                  <p className="text-gray-600">
                     {onboardingData.funding?.amount}{" "}
                     {role === "CRYPTO_TO_FIAT" ? "USDC" : "NGN"}
                  </p>
               </div>

               {role === "CRYPTO_TO_FIAT" ? (
                  <div className="border-t border-gray-200 pt-4">
                     <p className="font-medium">Returns Destination</p>
                     <p className="text-gray-600">
                        {onboardingData.bankDetails?.bankName}:{" "}
                        {onboardingData.bankDetails?.accountNumber}
                     </p>
                     <p className="text-gray-600">
                        {onboardingData.bankDetails?.accountName}
                     </p>
                  </div>
               ) : (
                  <div className="border-t border-gray-200 pt-4">
                     <p className="font-medium">Returns Destination</p>
                     <p className="text-gray-600 break-all">
                        {onboardingData.cryptoDestination?.address}
                        {onboardingData.cryptoDestination?.isConnectedWallet &&
                           " (Connected Wallet)"}
                     </p>
                  </div>
               )}

               <div className="border-t border-gray-200 pt-4">
                  <p className="font-medium">Expected Returns</p>
                  <p className="text-gray-600">
                     You will earn approximately 5.2% APR on your liquidity
                     position.
                  </p>
               </div>
            </div>
         </div>

         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
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
                     Your liquidity position will be active immediately. You can
                     monitor your position and earnings in your dashboard.
                  </p>
               </div>
            </div>
         </div>

         <div className="flex justify-center">
            <button
               type="button"
               className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
               onClick={handleFinish}>
               Go to Dashboard
               <FaArrowRight className="ml-2" />
            </button>
         </div>
      </div>
   );
};

export default SuccessConfirmation;
