import { useEffect } from "react";
import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
import StatsSection from "../components/StatsSection";
import FAQSection from "../components/FAQSection";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import BlockchainLogos from "../components/Blockchains";
import Navbar from "../components/Navbar/Navbar";

const LandingPage = () => {
   useEffect(() => {
      document.title = "OpenCash | P2P Digital Asset Exchange";
   }, []);

   return (
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
         <Navbar />
         <main className="flex-grow">
            <div className="m-10 mt-28">
               <HeroSection />
            </div>
            <BlockchainLogos />
            <FeatureSection />
            <StatsSection />
            <FAQSection />
            <CallToAction />
         </main>
         <Footer />
      </div>
   );
};

export default LandingPage;
