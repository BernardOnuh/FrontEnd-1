import React, {
   createContext,
   useState,
   useContext,
   ReactNode,
   useCallback,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
   OnboardingData,
   DashboardData,
   LiquidityContextType,
   ProcessStep,
   VerificationType,
   LiquidityPosition,
   PositionStatus,
   LiquidityRole,
} from "../types/LiquidityTypes";

// Default initial values
const defaultOnboardingData: OnboardingData = {
   currentStep: "ROLE_SELECTION",
};

const defaultDashboardData: DashboardData = {
   positions: [],
   rewards: {
      crypto: 0,
      fiat: {
         currency: "NGN",
         amount: 0,
      },
   },
};

// Create the context
export const LiquidityContext = createContext<LiquidityContextType | undefined>(
   undefined
);

// Context provider component
export const LiquidityProvider: React.FC<{ children: ReactNode }> = ({
   children,
}) => {
   // State management
   const [onboardingData, setOnboardingData] = useState<OnboardingData>(
      defaultOnboardingData
   );
   const [dashboardData, setDashboardData] =
      useState<DashboardData>(defaultDashboardData);

   // Privy wallet integration
   const {
      authenticated,
      login,
      connectWallet: privyConnectWallet,
      user,
   } = usePrivy();

   // Check if wallet is connected
   const isWalletConnected = !!(authenticated && user?.wallet?.address);
   const walletAddress = user?.wallet?.address || null;

   // Update onboarding data
   const updateOnboardingData = useCallback((data: Partial<OnboardingData>) => {
      setOnboardingData((prevData) => ({
         ...prevData,
         ...data,
      }));
   }, []);

   // Update onboarding step
   const updateOnboardingStep = useCallback((step: ProcessStep) => {
      setOnboardingData((prevData) => ({
         ...prevData,
         currentStep: step,
      }));
   }, []);

   // Reset onboarding
   const resetOnboarding = useCallback(() => {
      setOnboardingData(defaultOnboardingData);
   }, []);

   // Connect wallet
   const connectWallet = useCallback(async () => {
      try {
         if (!authenticated) {
            await login();
         }

         if (authenticated && !user?.wallet?.address) {
            await privyConnectWallet();
         }

         // Return type is void, so don't return a boolean
      } catch (error) {
         console.error("Failed to connect wallet:", error);
      }
   }, [authenticated, login, privyConnectWallet, user?.wallet?.address]);

   // Mock function for bank account verification
   // This will be replaced with actual API calls later
   const verifyBankAccount = useCallback(
      async (accountNumber: string, bankName: string) => {
         // Mock verification logic
         console.log(`Verifying bank account: ${accountNumber} at ${bankName}`);

         // Simulate API call
         return new Promise<boolean>((resolve) => {
            setTimeout(() => {
               // Mock success for accounts ending with valid digits
               const isValid =
                  accountNumber.length === 10 && /^[0-9]+$/.test(accountNumber);

               if (isValid) {
                  updateOnboardingData({
                     bankDetails: {
                        accountName: "John Doe", // This would come from the API
                        accountNumber,
                        bankName,
                        isDefault: true,
                        verified: true,
                     },
                  });
               }

               resolve(isValid);
            }, 1500); // Simulate network delay
         });
      },
      [updateOnboardingData]
   );

   // Mock function for KYC verification
   const verifyKYC = useCallback(
      async (type: VerificationType, id: string) => {
         console.log(`Verifying ${type} with ID: ${id}`);

         // Simulate API call
         return new Promise<boolean>((resolve) => {
            setTimeout(() => {
               // Mock validation logic
               const isValid = id.length === 11 && /^[0-9]+$/.test(id);

               if (isValid) {
                  updateOnboardingData({
                     kyc: {
                        verificationType: type,
                        verificationId: id,
                        status: "PENDING", // Initially set to PENDING
                     },
                  });

                  // After another delay, update to APPROVED
                  setTimeout(() => {
                     updateOnboardingData({
                        kyc: {
                           verificationType: type,
                           verificationId: id,
                           status: "APPROVED",
                        },
                     });
                  }, 3000);
               }

               resolve(isValid);
            }, 1500);
         });
      },
      [updateOnboardingData]
   );

   // Mock function for wallet funding
   const fundWallet = useCallback(
      async (amount: number) => {
         console.log(`Funding wallet with ${amount} USDC`);

         // Simulate transaction
         return new Promise<boolean>((resolve) => {
            setTimeout(() => {
               updateOnboardingData({
                  funding: {
                     amount,
                     transactionHash: `0x${Math.random()
                        .toString(16)
                        .substring(2, 42)}`,
                  },
               });

               resolve(true);
            }, 2000);
         });
      },
      [updateOnboardingData]
   );

   // Submit liquidity position
   const submitLiquidityPosition = useCallback(async () => {
      console.log("Submitting liquidity position", onboardingData);

      // Simulate API call
      return new Promise<boolean>((resolve) => {
         setTimeout(() => {
            // Create a new position
            const newPosition: LiquidityPosition = {
               id: `pos_${Date.now()}`,
               role: onboardingData.role as LiquidityRole,
               amount: onboardingData.funding?.amount || 0,
               currency:
                  onboardingData.role === "CRYPTO_TO_FIAT" ? "USDC" : "NGN",
               status: "ACTIVE" as PositionStatus,
               createdAt: new Date().toISOString(),
               returns: 0,
               apr: 5.2, // Sample APR
            };

            // Update dashboard data
            setDashboardData((prev) => ({
               ...prev,
               positions: [...prev.positions, newPosition],
            }));

            resolve(true);
         }, 2000);
      });
   }, [onboardingData]);

   // Prepare context value
   const contextValue: LiquidityContextType = {
      onboardingData,
      updateOnboardingData,
      updateOnboardingStep,
      resetOnboarding,
      dashboardData,
      isWalletConnected,
      connectWallet,
      walletAddress,
      verifyBankAccount,
      verifyKYC,
      fundWallet,
      submitLiquidityPosition,
   };

   return (
      <LiquidityContext.Provider value={contextValue}>
         {children}
      </LiquidityContext.Provider>
   );
};

// Custom hook for using the liquidity context
export const useLiquidity = () => {
   const context = useContext(LiquidityContext);

   if (context === undefined) {
      throw new Error("useLiquidity must be used within a LiquidityProvider");
   }

   return context;
};
