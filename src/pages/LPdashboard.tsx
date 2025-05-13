import React from "react";
import Nav from "../components/NavbarReset";
import Footer from "../components/PrimaryFooter";
import LiquidityDashboard from "../components/liquidity/dashboard/LiquidityDashboard";

const LPDashBoard: React.FC = () => {
   return (
      <div className=" min-h-screen">
         <Nav />
         <main className="mt-36">
            <LiquidityDashboard />
         </main>
         <Footer />
      </div>
   );
};

export default LPDashBoard;
