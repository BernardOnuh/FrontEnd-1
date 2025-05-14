import React from "react";
import Navbar from "../components/Navbar/components/Navbar";
import Footer from "../components/Footer";
import LiquidityProvider from "../components/liquidity/LiquidityProvider";

const LProvidersPage: React.FC = () => {
   return (
      <div className=" min-h-screen">
         <Navbar />
         <main className="mt-36">
            <LiquidityProvider />
         </main>
         <Footer />
      </div>
   );
};

export default LProvidersPage;
