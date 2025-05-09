import { useEffect } from "react";
import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
import StatsSection from "../components/StatsSection";
import FAQSection from "../components/FAQSection";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import BlockchainLogos from "../components/Blockchains";
import Nav from "../components/NavbarReset";

const LandingPage = () => {
   useEffect(() => {
      document.title = "OpenCash | P2P Digital Asset Exchange";
   }, []);

   return (
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
         {/* <Navbar isLanding={true} /> */}
         <Nav />
         <main className="flex-grow">
            <HeroSection />
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
