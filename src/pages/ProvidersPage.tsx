import React from "react";
import Nav from "../components/NavbarReset";
import Footer from "../components/Footer";
import LiquidityProvider from "../components/liquidity/LiquidityProvider";

const LProvidersPage: React.FC = () => {
   return (
      <div className=" min-h-screen">
         <Nav />
         <main className="mt-36">
            <LiquidityProvider />
         </main>
         <Footer />
      </div>
   );
};

export default LProvidersPage;
