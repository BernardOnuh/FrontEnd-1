import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "../components/NavbarReset";
import Footer from "../components/Footer";
import {
   FaExchangeAlt,
   FaCheckCircle,
   FaTimesCircle,
   FaClock,
} from "react-icons/fa";

interface Transaction {
   id: string;
   from: string;
   to: string;
   fromAmount: number;
   toAmount: number;
   status: "completed" | "pending" | "failed";
   date: string;
   type: "swap" | "receive" | "send";
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
   {
      id: "txn_1234567890",
      from: "ETH",
      to: "USD",
      fromAmount: 0.5,
      toAmount: 850.0,
      status: "completed",
      date: "2024-01-15T10:30:00Z",
      type: "swap",
   },
   {
      id: "txn_0987654321",
      from: "BTC",
      to: "NGN",
      fromAmount: 0.01,
      toAmount: 25000.0,
      status: "pending",
      date: "2024-01-14T15:45:00Z",
      type: "swap",
   },
   {
      id: "txn_5678901234",
      from: "USDC",
      to: "NGN",
      fromAmount: 1000.0,
      toAmount: 1200000.0,
      status: "failed",
      date: "2024-01-13T08:20:00Z",
      type: "swap",
   },
];

const ActivityPage: React.FC = () => {
   useEffect(() => {
      document.title = "OpenCash | Activity";
   }, []);

   const getStatusIcon = (status: Transaction["status"]) => {
      switch (status) {
         case "completed":
            return <FaCheckCircle className="text-green-500" />;
         case "pending":
            return <FaClock className="text-yellow-500" />;
         case "failed":
            return <FaTimesCircle className="text-red-500" />;
      }
   };

   const getStatusColor = (status: Transaction["status"]) => {
      switch (status) {
         case "completed":
            return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
         case "pending":
            return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
         case "failed":
            return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
      }
   };

   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   };

   return (
      <div className="flex flex-col min-h-screen bg-[#bfc5d3] text-black">
         <Nav />
         <main className="flex-grow mt-24">
            <div className="container mx-auto px-4 py-8">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}>
                  <h1 className="text-2xl font-bold mb-6">
                     Transaction Activity
                  </h1>

                  {/* Activity List */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                     {mockTransactions.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                           {mockTransactions.map((transaction) => (
                              <div
                                 key={transaction.id}
                                 className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                          <FaExchangeAlt className="text-purple-600 dark:text-purple-400" />
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <p className="font-semibold text-gray-900 dark:text-white">
                                                {transaction.fromAmount}{" "}
                                                {transaction.from}
                                             </p>
                                             <span className="text-gray-400">
                                                →
                                             </span>
                                             <p className="font-semibold text-gray-900 dark:text-white">
                                                {transaction.toAmount}{" "}
                                                {transaction.to}
                                             </p>
                                          </div>
                                          <p className="text-sm text-gray-500 dark:text-gray-400">
                                             {formatDate(transaction.date)}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span
                                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                             transaction.status
                                          )}`}>
                                          {transaction.status
                                             .charAt(0)
                                             .toUpperCase() +
                                             transaction.status.slice(1)}
                                       </span>
                                       {getStatusIcon(transaction.status)}
                                    </div>
                                 </div>
                                 <div className="mt-2 pl-14">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                       Transaction ID: {transaction.id}
                                    </p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                           <p className="text-lg mb-2">No transactions yet</p>
                           <p className="text-sm">
                              Your transaction history will appear here
                           </p>
                        </div>
                     )}
                  </div>
               </motion.div>
            </div>
         </main>
         <Footer />
      </div>
   );
};

export default ActivityPage;
