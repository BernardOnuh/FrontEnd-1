import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Search, Edit2, Loader, ChevronDown, X, ArrowRight } from "lucide-react";

// Types
interface Bank {
  name: string;
  code: string;
  type: string;
}



interface BankDetails {

  accountName: string;

  accountNumber: string;

  bankName: string;

  routingNumber?: string; 

  bankCountry: string;

  accountType: string;

  swiftCode?: string;

  bankAddress?: string;

}


interface BankVerificationFormProps {
  onVerified: (details: BankDetails) => void;
  authToken: string | null;
  onError: (message: string) => void;
  onClose?: () => void;
  initialBankDetails?: BankDetails | null;
}

const BankVerificationForm: React.FC<BankVerificationFormProps> = ({
  onVerified,
  authToken,
  onError,
  onClose,
  initialBankDetails
}) => {
  // State variables
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [selectedBankName, setSelectedBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [autoVerificationTriggered, setAutoVerificationTriggered] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "success" | "error" | "not_found">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isHovering, setIsHovering] = useState<number | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const verifiedBankDetails = useRef<BankDetails | null>(null);
  
  // Enhanced console logger
  const logger = (category: string, message: string, data?: any) => {
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

  // Load existing bank details if provided
  useEffect(() => {
    if (initialBankDetails) {
      setAccountNumber(initialBankDetails.accountNumber || "");
      setAccountName(initialBankDetails.accountName || "");
      
      // If we have bank details but need to find the bank code
      if (initialBankDetails.bankName && !initialBankDetails.routingNumber) {
        setSearchQuery(initialBankDetails.bankName);
      } 
      // If we have both name and code
      else if (initialBankDetails.bankName && initialBankDetails.routingNumber) {
        setSelectedBank(initialBankDetails.routingNumber);
        setSelectedBankName(initialBankDetails.bankName);
        setSearchQuery(initialBankDetails.bankName);
      }
      
      // If account is already verified, switch to view mode
      if (initialBankDetails.accountName && initialBankDetails.accountNumber) {
        setIsEditing(false);
        setVerificationStatus("success");
        verifiedBankDetails.current = initialBankDetails;
      }
    }
  }, [initialBankDetails]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch banks on component mount
  useEffect(() => {
    fetchBanks();
  }, [authToken]);

  // Auto-verification when account number reaches 10 digits
  useEffect(() => {
    const attemptAutoVerification = async () => {
      if (
        accountNumber.length === 10 && 
        selectedBank && 
        !isVerifying && 
        verificationStatus !== "success" &&
        !autoVerificationTriggered
      ) {
        setAutoVerificationTriggered(true);
        await verifyAccount();
        setAutoVerificationTriggered(false);
      }
    };
    
    attemptAutoVerification();
  }, [accountNumber, selectedBank, isVerifying, verificationStatus]);

  // Fetch banks from API
  const fetchBanks = async () => {
    try {
      logger('API', 'Fetching bank institutions');
      
      if (!authToken) {
        onError("Authentication required to fetch banks");
        return;
      }
      
      setVerificationStatus("loading");
      
      const response = await fetch("https://aboki-api.onrender.com/api/bank/institutions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setBanks(data.data);
        setVerificationStatus("idle");
        logger('API', `Successfully fetched ${data.data.length} banks`);
      } else {
        setVerificationStatus("error");
        logger('ERROR', 'Failed to fetch banks', data);
        onError("Failed to fetch bank list");
      }
    } catch (error) {
      setVerificationStatus("error");
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger('ERROR', `Error fetching banks: ${errorMsg}`, error);
      onError(`Failed to fetch banks: ${errorMsg}`);
    }
  };

  // Verify account with API
  const verifyAccount = async () => {
    if (!accountNumber || !selectedBank) {
      onError("Please provide both account number and select a bank");
      return;
    }
    
    if (accountNumber.length < 10) {
      onError("Account number should be at least 10 digits");
      return;
    }
    
    try {
      setIsVerifying(true);
      setVerificationStatus("loading");
      setErrorMessage("");
      logger('API', 'Verifying bank account', { accountNumber, bankCode: selectedBank });
      
      if (!authToken) {
        throw new Error("Authentication required to verify account");
      }
      
      const response = await fetch("https://aboki-api.onrender.com/api/bank/verify-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          accountNumber,
          institution: selectedBank
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        logger('API', 'Account verification successful', { accountData: data.data });
        
        // Handle the case where data.data is a string (the account name)
        const accountNameFromResponse = typeof data.data === 'string' ? data.data : 
            (data.data.accountName || "");
        
        // Check if we actually got an account name
        if (!accountNameFromResponse || accountNameFromResponse.trim() === "") {
          setVerificationStatus("not_found");
          setErrorMessage("Account not found. Please check your details and try again.");
          logger('ERROR', 'Account verification successful but no account name returned', data);
          return;
        }
        
        setAccountName(accountNameFromResponse);
        setVerificationStatus("success");
        setIsEditing(false); // Exit editing mode after successful verification
        
        // Create bank details object
        const selectedBankObj = banks.find(bank => bank.code === selectedBank);
        
        const bankDetails: BankDetails = {
          accountName: accountNameFromResponse,
          accountNumber: accountNumber,
          bankName: selectedBankObj?.name || "",
          routingNumber: selectedBank,
          bankCountry: "Nigeria",
          accountType: "savings", // Default to savings
          swiftCode: selectedBank,
          bankAddress: ""
        };
        
        // Store the verified details for later use
        verifiedBankDetails.current = bankDetails;
      } else {
        if (data.message && data.message.toLowerCase().includes("not found")) {
          setVerificationStatus("not_found");
          setErrorMessage("Account not found. Please check your details and try again.");
        } else {
          setVerificationStatus("error");
          setErrorMessage(data.message || "Failed to verify account");
        }
        logger('ERROR', 'Account verification failed', data);
        onError(data.message || "Failed to verify account");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger('ERROR', `Error verifying account: ${errorMsg}`, error);
      setVerificationStatus("error");
      setErrorMessage(`Account verification failed: ${errorMsg}`);
      onError(`Account verification failed: ${errorMsg}`);
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Handle continue button click
  const handleContinue = () => {
    if (verifiedBankDetails.current) {
      onVerified(verifiedBankDetails.current);
    }
  };
  
  // Handle edit button click
  const handleEdit = () => {
    setIsEditing(true);
    setVerificationStatus("idle");
    setErrorMessage("");
  };

  // Filter banks based on search query
  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom animation variants
  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="w-full bg-white rounded-xl space-y-6 shadow-sm">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {!isEditing && verificationStatus === "success" 
            ? "Bank Account Details" 
            : "Verify Your Bank Account"}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {!isEditing && verificationStatus === "success"
            ? "Your bank account has been verified successfully"
            : "Please provide your bank details to receive payments in Nigerian Naira (₦)"}
        </p>
      </div>
      
      {/* Bank Selection - Show only in editing mode */}
      {isEditing && (
        <motion.div 
          className="space-y-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
        >
          <label className="block text-sm font-medium text-gray-700">Select Your Bank</label>
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center relative">
              <Search className="absolute left-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for your bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                disabled={verificationStatus === "loading"}
              />
              <ChevronDown 
                className={`absolute right-3 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                size={18} 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              />
            </div>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {verificationStatus === "loading" && banks.length === 0 ? (
                    <div className="px-4 py-3 text-center">
                      <Loader className="inline-block animate-spin mr-2 text-purple-600" size={18} />
                      <span className="text-gray-600">Loading banks...</span>
                    </div>
                  ) : (
                    <>
                      {filteredBanks.length === 0 ? (
                        <div className="px-4 py-3 text-center text-gray-500">
                          {searchQuery ? "No banks found matching your search" : "Start typing to search for banks"}
                        </div>
                      ) : (
                        <div className="py-1">
                          {filteredBanks.map((bank, index) => (
                            <button
                              key={bank.code}
                              onMouseEnter={() => setIsHovering(index)}
                              onMouseLeave={() => setIsHovering(null)}
                              onClick={() => {
                                setSelectedBank(bank.code);
                                setSelectedBankName(bank.name);
                                setSearchQuery(bank.name);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex justify-between items-center"
                            >
                              <span className="text-gray-800">{bank.name}</span>
                              {isHovering === index && (
                                <motion.span 
                                  initial={{ opacity: 0, scale: 0.8 }} 
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-500"
                                >
                                  {bank.code}
                                </motion.span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {selectedBank && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-sm text-green-600 flex items-center gap-1 mt-1"
            >
              <CheckCircle size={14} />
              Selected: {selectedBankName}
            </motion.p>
          )}
        </motion.div>
      )}
      
      {/* Bank Info Display - Show when not editing and verification successful */}
      {!isEditing && verificationStatus === "success" && (
        <motion.div 
          className="mb-4"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideUp}
        >
          <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-gray-900">Bank Account Details</h3>
              <button 
                onClick={handleEdit}
                className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-purple-200 transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
            </div>
            
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Bank Name</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedBankName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Account Number</span>
                <span className="text-sm font-medium text-gray-900 font-mono">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Account Name</span>
                <span className="text-sm font-medium text-gray-900">{accountName}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Account Number Input - Show only in editing mode */}
      {isEditing && (
        <motion.div 
          className="space-y-2"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
        >
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter 10-digit account number"
              value={accountNumber}
              onChange={(e) => {
                // Only allow digits and limit to 10 characters
                const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                setAccountNumber(value);
                
                // Reset error status when editing
                if (verificationStatus === "not_found" || verificationStatus === "error") {
                  setVerificationStatus("idle");
                  setErrorMessage("");
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              disabled={verificationStatus === "loading"}
            />
            {accountNumber.length > 0 && (
              <button 
                onClick={() => setAccountNumber('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-2 rounded-full transition-all ${accountNumber.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`} style={{ width: `${accountNumber.length * 10}%` }}></div>
            <p className="text-xs text-gray-500">{10 - accountNumber.length} digits remaining</p>
          </div>
        </motion.div>
      )}
      
      {/* Verification Button - Show only in editing mode */}
      {isEditing && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
        >
          <button
            onClick={verifyAccount}
            disabled={!selectedBank || accountNumber.length < 10 || isVerifying || verificationStatus === "loading"}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              !selectedBank || accountNumber.length < 10 || isVerifying || verificationStatus === "loading"
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:opacity-90 shadow-md"
            }`}
          >
            {isVerifying || verificationStatus === "loading" ? (
              <>
                <Loader className="animate-spin" size={18} />
                Verifying Account...
              </>
            ) : (
              <>
                Verify Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </motion.div>
      )}
      
      {/* Continue Button - Show after successful verification */}
      {!isEditing && verificationStatus === "success" && (
        <motion.button
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideUp}
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-lg font-medium transition-all bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:opacity-90 shadow-md flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={18} />
        </motion.button>
      )}
      
      {/* Account Not Found Message */}
      <AnimatePresence>
        {verificationStatus === "not_found" && (
          <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideUp}
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start">
              <AlertCircle className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-amber-700 font-medium">
                  Account not found
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  Please check the account number and bank details and try again. Make sure you've selected the correct bank.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* General Error Message */}
      <AnimatePresence>
        {verificationStatus === "error" && (
          <motion.div 
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideUp}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-start">
              <AlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
              <div>
                <p className="text-sm text-red-700 font-medium">
                  Verification failed
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {errorMessage || "Please check the account number and bank details and try again."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cancel Button - Always show */}
      {onClose && (
        <motion.button
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeIn}
          type="button"
          onClick={onClose}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </motion.button>
      )}
    </div>
  );
};

export default BankVerificationForm;