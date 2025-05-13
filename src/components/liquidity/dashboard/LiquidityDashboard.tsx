import React from "react";
import { useLiquidity } from "../../../context/LiquidityContext";
import {
   LiquidityPosition,
   PositionStatus,
} from "../../../types/LiquidityTypes";
import { FaPlus, FaWallet, FaDollarSign, FaCoins } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PrimaryFooter from "../../PrimaryFooter";

// Position card component
const PositionCard: React.FC<{ position: LiquidityPosition }> = ({
   position,
}) => {
   // Format date
   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "short",
         day: "2-digit",
      }).format(date);
   };

   // Get status color
   const getStatusColor = (status: PositionStatus) => {
      switch (status) {
         case "ACTIVE":
            return "bg-green-100 text-green-800";
         case "PAUSED":
            return "bg-yellow-100 text-yellow-800";
         case "COMPLETED":
            return "bg-gray-100 text-gray-800";
         default:
            return "bg-gray-100 text-gray-800";
      }
   };

   // Get position icon
   const getPositionIcon = (_: string, currency: string) => {
      if (currency === "USDC") {
         return <FaCoins className="text-purple-500" />;
      } else {
         return <FaDollarSign className="text-blue-500" />;
      }
   };

   return (
      <div className="bg-white border border-gray-200 rounded-lg p-5 transition-all duration-300 hover:shadow-md">
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
               <div className="p-3 rounded-full bg-gray-100 mr-3">
                  {getPositionIcon(position.role, position.currency)}
               </div>
               <div>
                  <h3 className="font-medium text-lg">
                     {position.role === "CRYPTO_TO_FIAT"
                        ? "Crypto Liquidity"
                        : "Fiat Liquidity"}
                  </h3>
                  <p className="text-sm text-gray-500">
                     {formatDate(position.createdAt)}
                  </p>
               </div>
            </div>
            <span
               className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                  position.status
               )}`}>
               {position.status}
            </span>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
               <p className="text-sm text-gray-500">Amount</p>
               <p className="font-semibold">
                  {position.amount.toLocaleString()} {position.currency}
               </p>
            </div>
            <div>
               <p className="text-sm text-gray-500">Returns</p>
               <p className="font-semibold text-green-600">
                  +{position.returns.toLocaleString()}{" "}
                  {position.role === "CRYPTO_TO_FIAT" ? "NGN" : "USDC"}
               </p>
            </div>
         </div>

         <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Performance</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
               <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                     width: `${
                        (position.returns / (position.amount * 0.1)) * 100
                     }%`,
                  }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{position.apr}% APR</p>
         </div>

         <div className="flex justify-between items-center">
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
               View Details
            </button>

            {position.status === "ACTIVE" && (
               <button className="px-3 py-1 border border-purple-600 text-purple-600 rounded-md text-sm hover:bg-purple-50">
                  Withdraw
               </button>
            )}
         </div>
      </div>
   );
};

// Empty state component
const EmptyState: React.FC<{ onAddNew: () => void }> = ({ onAddNew }) => {
   return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
         <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
            <FaWallet className="h-8 w-8 text-purple-600" />
         </div>
         <h3 className="text-lg font-medium mb-2">No active positions</h3>
         <p className="text-gray-600 mb-6">
            You don't have any liquidity positions yet. Start earning by adding
            liquidity.
         </p>
         <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={onAddNew}>
            <FaPlus className="mr-2" />
            Add New Position
         </button>
      </div>
   );
};

// Rewards card component
const RewardsCard: React.FC = () => {
   const { dashboardData } = useLiquidity();

   return (
      <div className="bg-white border border-gray-200 rounded-lg p-5">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-lg">Rewards earned</h3>
            <span className="text-gray-500 text-sm flex items-center">
               <svg
                  className="w-4 h-4 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                     d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  />
                  <path
                     d="M12 6V12L16 14"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  />
               </svg>
               All time
            </span>
         </div>

         <div>
            {dashboardData.rewards.crypto > 0 && (
               <div className="mb-4">
                  <p className="text-sm text-gray-500">USDC Earnings</p>
                  <p className="text-2xl font-bold">
                     {dashboardData.rewards.crypto.toLocaleString()} USDC
                  </p>
               </div>
            )}

            {dashboardData.rewards.fiat.amount > 0 && (
               <div>
                  <p className="text-sm text-gray-500">NGN Earnings</p>
                  <p className="text-2xl font-bold">
                     {dashboardData.rewards.fiat.amount.toLocaleString()}{" "}
                     {dashboardData.rewards.fiat.currency}
                  </p>
               </div>
            )}

            {dashboardData.rewards.crypto === 0 &&
               dashboardData.rewards.fiat.amount === 0 && (
                  <div>
                     <p className="text-sm text-gray-500">No earnings yet</p>
                     <p className="text-2xl font-bold">0 USDC</p>
                  </div>
               )}
         </div>

         <button className="mt-4 w-full py-2 border border-purple-600 text-purple-600 rounded-md text-sm hover:bg-purple-50 transition-colors">
            Collect rewards
         </button>
      </div>
   );
};

// Main dashboard component
const LiquidityDashboard: React.FC = () => {
   const { dashboardData } = useLiquidity();
   const navigate = useNavigate();

   // Handle add new position
   const handleAddNew = () => {
      navigate("/add-liquidity");
   };

   return (
      <>
         <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="md:col-span-3">
                  <RewardsCard />
               </div>
            </div>

            <div className="mb-6">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                     Your positions
                  </h2>

                  <div className="flex space-x-2">
                     <button
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        onClick={handleAddNew}>
                        <FaPlus className="mr-2" />
                        New
                     </button>

                     <div className="relative">
                        <select
                           className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                           defaultValue="all">
                           <option value="all">All Positions</option>
                           <option value="crypto">Crypto Liquidity</option>
                           <option value="fiat">Fiat Liquidity</option>
                        </select>
                     </div>
                  </div>
               </div>

               {dashboardData.positions.length === 0 ? (
                  <EmptyState onAddNew={handleAddNew} />
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {dashboardData.positions.map((position) => (
                        <PositionCard key={position.id} position={position} />
                     ))}
                  </div>
               )}
            </div>
         </div>
         <PrimaryFooter />
      </>
   );
};

export default LiquidityDashboard;
