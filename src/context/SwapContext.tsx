import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { TokenSymbol, CurrencySymbol } from '../types/SwapTypes';

export interface SwapDetails {
  fromToken: TokenSymbol | CurrencySymbol;
  toToken: TokenSymbol | CurrencySymbol;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  swiftCode?: string;
  bankAddress?: string;
  bankCountry: string;
  accountType: "savings" | "checking";
}

interface SwapContextType {
  swapDetails: SwapDetails | null;
  setSwapDetails: (details: SwapDetails | null) => void;
  bankDetails: BankDetails | null;
  setBankDetails: (details: BankDetails | null) => void;
  verifyBankAccount: (accountNumber: string, institutionCode: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
}

interface SwapProviderProps {
  children: ReactNode;
  initialAuthToken?: string | null;
}

// Context default
export const SwapContext = createContext<SwapContextType>({
  swapDetails: null,
  setSwapDetails: () => {},
  bankDetails: null,
  setBankDetails: () => {},
  verifyBankAccount: async () => false,
  isVerifying: false,
  verificationError: null,
});

export const SwapProvider: React.FC<SwapProviderProps> = ({ children, initialAuthToken = null }) => {
  const [swapDetails, setSwapDetails] = useState<SwapDetails | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(initialAuthToken);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken && storedToken !== authToken) {
      setAuthToken(storedToken);
    }
  }, []);

  const logWithDetails = (category: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${category}] ${message}`;
    if (data) {
      console.groupCollapsed(formattedMessage);
      console.log(data);
      console.groupEnd();
    } else {
      console.log(formattedMessage);
    }
  };

  const verifyBankAccount = async (accountNumber: string, institutionCode: string): Promise<boolean> => {
    if (!authToken) {
      setVerificationError("Authentication required to verify account");
      return false;
    }

    try {
      setIsVerifying(true);
      setVerificationError(null);

      logWithDetails('API', 'Verifying bank account', { accountNumber, institutionCode });

      const response = await fetch("https://aboki-api.onrender.com/api/bank/verify-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ accountNumber, institution: institutionCode })
      });

      if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

      const data = await response.json();

      if (data.success && data.data) {
        // Get bank name
        let bankName = "";
        const bankResponse = await fetch("https://aboki-api.onrender.com/api/bank/institutions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          }
        });

        if (bankResponse.ok) {
          const bankData = await bankResponse.json();
          const bank = bankData.data?.find((b: any) => b.code === institutionCode);
          bankName = bank?.name || "";
        }

        const newBankDetails: BankDetails = {
          accountName: data.data.accountName,
          accountNumber,
          bankName,
          routingNumber: institutionCode,
          bankCountry: "Nigeria",
          accountType: "savings",
          swiftCode: institutionCode,
          bankAddress: ""
        };

        setBankDetails(newBankDetails);
        logWithDetails('SUCCESS', 'Bank account verified successfully', newBankDetails);

        try {
          await fetch("https://aboki-api.onrender.com/api/user/bank-details", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(newBankDetails)
          });
        } catch (error) {
          logWithDetails('WARNING', 'Failed to save bank details to backend', error);
        }

        return true;
      } else {
        setVerificationError(data.message || "Failed to verify account");
        logWithDetails('ERROR', 'Account verification failed', data);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setVerificationError(`Account verification failed: ${errorMsg}`);
      logWithDetails('ERROR', `Error verifying account: ${errorMsg}`, error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const contextValue: SwapContextType = {
    swapDetails,
    setSwapDetails,
    bankDetails,
    setBankDetails,
    verifyBankAccount,
    isVerifying,
    verificationError,
  };

  return (
    <SwapContext.Provider value={contextValue}>
      {children}
    </SwapContext.Provider>
  );
};

// Hook
export const useSwap = () => useContext(SwapContext);
