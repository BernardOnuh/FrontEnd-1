import React from "react";
import { FaTwitter, FaGithub, FaTelegram, FaDiscord } from "react-icons/fa";

const PrimaryFooter: React.FC = () => {
   return (
      <footer className="bg-[#121721] text-gray-300 py-8 mt-auto">
         <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
               {/* Logo and Description */}
               <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">₹</span>
                     </div>
                     <span className="text-xl font-bold text-white">Aboki</span>
                  </div>
                  <p className="text-sm text-gray-400">
                     Seamless crypto to fiat swaps
                  </p>
               </div>

               {/* Social Links */}
               <div className="flex gap-4">
                  <a
                     href="#"
                     className="hover:text-purple-500 transition-colors">
                     <FaTwitter size={20} />
                  </a>
                  <a
                     href="#"
                     className="hover:text-purple-500 transition-colors">
                     <FaGithub size={20} />
                  </a>
                  <a
                     href="#"
                     className="hover:text-purple-500 transition-colors">
                     <FaTelegram size={20} />
                  </a>
                  <a
                     href="#"
                     className="hover:text-purple-500 transition-colors">
                     <FaDiscord size={20} />
                  </a>
               </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
               <p>
                  &copy; {new Date().getFullYear()} OpenCash. All rights
                  reserved.
               </p>
            </div>
         </div>
      </footer>
   );
};

export default PrimaryFooter;
