import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SwapCard from "../components/SwapCard";
import Nav from "../components/NavbarReset";
import ConfirmSwapModal from "../components/modals/ConfirmSwapModal";
import BankDetailsModal from "../components/modals/BankDetailsModal";
import ReviewModal from "../components/modals/ReviewModal";
import SuccessModal from "../components/modals/SuccessModal";
import { SwapContext, SwapDetails, BankDetails } from "../context/SwapContext";
import PrimaryFooter from "../components/PrimaryFooter";

const SwapPage: React.FC = () => {
   const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
   const [isBankDetailsModalOpen, setIsBankDetailsModalOpen] = useState(false);
   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
   const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
   const [isTransactionSuccess, setIsTransactionSuccess] = useState(true);

   const [swapDetails, setSwapDetails] = useState<SwapDetails | null>(null);
   const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

   useEffect(() => {
      document.title = "OpenCash | Swap";
   }, []);

   const handleSwapInitiate = (details: SwapDetails) => {
      setSwapDetails(details);
      setIsConfirmModalOpen(true);
   };

   const handleConfirmSwap = () => {
      setIsConfirmModalOpen(false);
      setIsBankDetailsModalOpen(true);
   };

   const handleBankDetailsSubmit = (details: BankDetails) => {
      setBankDetails(details);
      setIsBankDetailsModalOpen(false);
      setIsReviewModalOpen(true);
   };

   const handleFinalConfirm = async () => {
      setIsReviewModalOpen(false);

      // Simulate API call
      try {
         // const response = await processSwap({ swapDetails, bankDetails });
         await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

         // Simulate success/failure randomly for demo
         const success = Math.random() > 0.2; // 80% success rate
         setIsTransactionSuccess(success);
      } catch (error) {
         setIsTransactionSuccess(false);
      }

      setIsSuccessModalOpen(true);
   };

   const handleTransactionComplete = () => {
      setIsSuccessModalOpen(false);
      // Reset all state
      setSwapDetails(null);
      setBankDetails(null);
   };

   return (
      <SwapContext.Provider value={{ swapDetails, bankDetails }}>
         <div className="flex flex-col min-h-screen bg-[#ffffff] text-black">
            <Nav />
            <main className="flex-grow mt-24">
               <div className="container mx-auto px-4 py-8">
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.5 }}>
                     <h1 className="text-2xl font-bold mb-6">Swap</h1>
                     <SwapCard onSwapInitiate={handleSwapInitiate} />
                  </motion.div>
               </div>
            </main>

            <PrimaryFooter />

            {/* Modals */}
            <ConfirmSwapModal
               isOpen={isConfirmModalOpen}
               onClose={() => setIsConfirmModalOpen(false)}
               onConfirm={handleConfirmSwap}
               swapDetails={swapDetails}
            />

            <BankDetailsModal
               isOpen={isBankDetailsModalOpen}
               onClose={() => setIsBankDetailsModalOpen(false)}
               onSubmit={handleBankDetailsSubmit}
            />

            <ReviewModal
               isOpen={isReviewModalOpen}
               onClose={() => setIsReviewModalOpen(false)}
               onConfirm={handleFinalConfirm}
               swapDetails={swapDetails}
               bankDetails={bankDetails}
            />

            <SuccessModal
               isOpen={isSuccessModalOpen}
               onClose={handleTransactionComplete}
               isSuccess={isTransactionSuccess}
               transactionId={`txn_${Date.now()}`}
            />
         </div>
      </SwapContext.Provider>
   );
};

export default SwapPage;
