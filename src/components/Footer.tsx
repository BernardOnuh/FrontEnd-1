import { Link } from "react-router-dom";

import { FaTwitter, FaGithub, FaTelegram, FaDiscord } from "react-icons/fa";
import Logo from "./Logo";

const Footer = () => {
   return (
      <footer className="bg-gray-50 text-gray-600">
         <div className="container mx-auto px-6 md:px-12 py-16">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
               {/* Brand */}
               <div className="md:col-span-2">
                  <Link to="/" className="flex items-center space-x-2 mb-6">
                     <Logo />
                  </Link>
                  <p className="mb-6 mr-10 md:w-2/3 text-[#333] leading-relaxed ">
                     The future of peer-to-peer digital asset exchange. Fast,
                     secure, and low-fee transactions for everyone.
                  </p>
                  <div className="flex space-x-5">
                     <a
                        href="#"
                        className="text-gray-500 hover:text-purple-600 transition-colors">
                        <FaTwitter className="h-6 w-6" />
                        FaTwitter, FaGithub, FaTelegram, FaDiscord
                     </a>
                     <a
                        href="#"
                        className="text-gray-500 hover:text-purple-600 transition-colors">
                        <FaDiscord className="h-6 w-6" />
                     </a>
                     <a
                        href="#"
                        className="text-gray-500 hover:text-purple-600 transition-colors">
                        <FaGithub className="h-6 w-6" />
                     </a>
                     <a
                        href="#"
                        className="text-gray-500 hover:text-purple-600 transition-colors">
                        <FaTelegram className="h-6 w-6" />
                     </a>
                  </div>
               </div>

               {/* Quick Links */}
               <div>
                  <h3 className="text-gray-800 font-semibold text-lg mb-4">
                     Quick Links
                  </h3>
                  <ul className="space-y-3">
                     <li>
                        <Link
                           to="/"
                           className="hover:text-purple-600 transition-colors">
                           Home
                        </Link>
                     </li>
                     <li>
                        <a
                           href="#features"
                           className="hover:text-purple-600 transition-colors">
                           Features
                        </a>
                     </li>
                     <li>
                        <a
                           href="#about"
                           className="hover:text-purple-600 transition-colors">
                           About Us
                        </a>
                     </li>
                     <li>
                        <a
                           href="#faq"
                           className="hover:text-purple-600 transition-colors">
                           FAQ
                        </a>
                     </li>
                     <li>
                        <Link
                           to="/app"
                           className="hover:text-purple-600 transition-colors">
                           Launch App
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Resources */}
               <div>
                  <h3 className="text-gray-800 font-semibold text-lg mb-4">
                     Resources
                  </h3>
                  <ul className="space-y-3">
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Documentation
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           API
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Developers
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Blog
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Tutorials
                        </a>
                     </li>
                  </ul>
               </div>

               {/* Legal */}
               <div>
                  <h3 className="text-gray-800 font-semibold text-lg mb-4">
                     Legal
                  </h3>
                  <ul className="space-y-3">
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Privacy Policy
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Terms of Service
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Disclaimer
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Risk Disclosure
                        </a>
                     </li>
                     <li>
                        <a
                           href="#"
                           className="hover:text-purple-600 transition-colors">
                           Cookie Policy
                        </a>
                     </li>
                  </ul>
               </div>
            </div>

            {/* Footer bottom */}
            <div className="border-t border-gray-200 mt-12 pt-8 text-center text-gray-500 text-sm">
               &copy; {new Date().getFullYear()} OpenCash. All rights reserved.
            </div>
         </div>
      </footer>
   );
};

export default Footer;
