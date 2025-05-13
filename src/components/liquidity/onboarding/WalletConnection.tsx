import React, { useState } from "react";
import { useLiquidity } from "../../../context/LiquidityContext";
// import NavigationButtons from "../common/NavigationButtons";
import { FaWallet, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";

const WalletConnection: React.FC = () => {
   const {
      isWalletConnected,
      connectWallet,
      walletAddress,
      updateOnboardingStep,
   } = useLiquidity();
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Handle wallet connection
   const handleConnectWallet = async () => {
      setLoading(true);
      setError(null);

      try {
         await connectWallet();
         // Wait a moment before proceeding to ensure wallet state is updated
         setTimeout(() => {
            setLoading(false);
            if (isWalletConnected) {
               // Move to the next step
               handleNext();
            }
         }, 1000);
      } catch (err) {
         setError("Failed to connect wallet. Please try again.");
         console.error("Wallet connection error:", err);
         setLoading(false);
      }
   };

   // Move to the next step
   const handleNext = () => {
      updateOnboardingStep("ROLE_SELECTION");
   };

   // Handle skip
   const handleSkip = () => {
      // Proceed without wallet connection
      handleNext();
   };

   return (
      <div className="max-w-lg mx-auto">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
               Connect Your Wallet
            </h2>
            <p className="mt-2 text-gray-600">
               Connect your wallet to provide liquidity or continue without
               connecting
            </p>
         </div>

         {isWalletConnected ? (
            <div className="text-center border border-green-200 rounded-lg p-8 mb-6 bg-green-50">
               <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                     <FaWallet className="text-green-600 text-3xl" />
                  </div>
               </div>
               <h3 className="text-lg font-medium mb-2 text-green-800">
                  Wallet Connected!
               </h3>
               <p className="text-gray-700 mb-4 break-all">{walletAddress}</p>
               <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={handleNext}>
                  Continue
                  <FaArrowRight className="ml-2" />
               </button>
            </div>
         ) : (
            <div className="text-center border rounded-lg p-8 mb-6">
               <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                     <FaWallet className="text-purple-600 text-3xl" />
                  </div>
               </div>
               <h3 className="text-lg font-medium mb-2">Connect Your Wallet</h3>
               <p className="text-gray-600 mb-6">
                  Connecting your wallet makes it easier to provide liquidity
                  and track your positions.
               </p>
               <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                     type="button"
                     className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                     onClick={handleConnectWallet}
                     disabled={loading}>
                     {loading ? "Connecting..." : "Connect Wallet"}
                  </button>
                  <button
                     type="button"
                     className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                     onClick={handleSkip}
                     disabled={loading}>
                     Skip for Now
                  </button>
               </div>

               {error && (
                  <div className="mt-4 text-red-600">
                     <FaExclamationTriangle className="inline mr-1" />
                     {error}
                  </div>
               )}
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
                     Connecting your wallet is optional but recommended. You can
                     always connect your wallet later. If you skip this step,
                     some features might be limited.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default WalletConnection;
