import React from "react";
import { FaTwitter, FaGithub, FaTelegram, FaDiscord } from "react-icons/fa";
import Logo from "./Logo";

const Footer: React.FC = () => {
   return (
      <footer className="bg-[#121721] text-gray-300 py-8 mt-auto">
         <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
               <Logo />

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

export default Footer;
