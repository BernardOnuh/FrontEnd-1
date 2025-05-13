import { CurrencySymbol } from "./SwapTypes";

// Role types for liquidity providers
export type LiquidityRole = "CRYPTO_TO_FIAT" | "FIAT_TO_CRYPTO";

// Status types for positions and processes
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PositionStatus = "ACTIVE" | "PAUSED" | "COMPLETED";
export type ProcessStep =
   | "WALLET_CONNECTION"
   | "ROLE_SELECTION"
   | "PROFILE_SETUP"
   | "KYC_VERIFICATION"
   | "WALLET_FUNDING"
   | "BANK_DETAILS"
   | "CRYPTO_DESTINATION"
   | "VIRTUAL_ACCOUNT_FUNDING"
   | "CONFIRMATION";

// KYC verification types
export type VerificationType = "BVN" | "NIN";

// Bank account interface
export interface BankAccount {
   accountName: string;
   accountNumber: string;
   bankName: string;
   isDefault: boolean;
   verified: boolean;
}

// Wallet interface
export interface WalletDetails {
   address: string;
   isConnectedWallet: boolean;
}

// Provider position data
export interface LiquidityPosition {
   id: string;
   role: LiquidityRole;
   amount: number;
   currency: CurrencySymbol | "USDC";
   status: PositionStatus;
   createdAt: string;
   returns: number;
   apr: number;
}

// Onboarding state interface
export interface OnboardingData {
   currentStep: ProcessStep;
   role?: LiquidityRole;
   profile?: {
      fullName: string;
      username: string;
      email: string;
   };
   kyc?: {
      verificationType: VerificationType;
      verificationId: string;
      status: VerificationStatus;
   };
   funding?: {
      amount: number;
      walletAddress?: string;
      transactionHash?: string;
   };
   bankDetails?: BankAccount;
   cryptoDestination?: WalletDetails;
   virtualAccount?: {
      accountNumber: string;
      bankName: string;
      accountName: string;
      reference: string;
   };
}

// Dashboard state interface
export interface DashboardData {
   positions: LiquidityPosition[];
   rewards: {
      crypto: number;
      fiat: {
         currency: CurrencySymbol;
         amount: number;
      };
   };
}

// Context interface
export interface LiquidityContextType {
   // Onboarding state
   onboardingData: OnboardingData;
   updateOnboardingData: (data: Partial<OnboardingData>) => void;
   updateOnboardingStep: (step: ProcessStep) => void;
   resetOnboarding: () => void;

   // Dashboard state
   dashboardData: DashboardData;

   // User state
   isWalletConnected: boolean;
   connectWallet: () => Promise<void>;
   walletAddress: string | null;
   isUserVerified: boolean;
   setUserVerified: (verified: boolean) => void;

   // Process functions
   verifyBankAccount: (
      accountNumber: string,
      bankName: string
   ) => Promise<boolean>;
   verifyKYC: (type: VerificationType, id: string) => Promise<boolean>;
   fundWallet: (amount: number) => Promise<boolean>;
   submitLiquidityPosition: () => Promise<boolean>;
}
