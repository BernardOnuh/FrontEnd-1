import React from "react";
import Navbar from "../components/Navbar/components/Navbar";

import LiquidityDashboard from "../components/liquidity/dashboard/LiquidityDashboard";

const LPDashBoard: React.FC = () => {
   return (
      <div className=" min-h-screen">
         <Navbar />
         <main className="mt-36">
            <LiquidityDashboard />
         </main>
      </div>
   );
};

export default LPDashBoard;
