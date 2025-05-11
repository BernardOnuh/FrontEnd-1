import React from "react";
import Nav from "../components/NavbarReset";
import Footer from "../components/PrimaryFooter";

const ProvidersPage: React.FC = () => {
   return (
      <div className="flex flex-col min-h-screen">
         <Nav />
         <main className="flex-grow container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Our Providers</h1>
            <p className="text-lg">
               We work with a variety of trusted providers to bring you the best
               services.
            </p>
            {/* Add provider details or components here */}
         </main>
         <Footer />
      </div>
   );
};

export default ProvidersPage;
