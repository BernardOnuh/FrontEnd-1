import React, { useState } from "react";
import { CurrencySymbol } from "../../../types/SwapTypes";

interface CurrencySelectorProps {
   currencies: Array<{
      symbol: CurrencySymbol;
      name: string;
      flag: string;
      available?: boolean;
   }>;
   selectedCurrency: CurrencySymbol;
   onSelect: (currency: CurrencySymbol) => void;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
   currencies,
   selectedCurrency,
   onSelect,
}) => {
   const [isOpen, setIsOpen] = useState(false);

   // Find the currently selected currency
   const selected = currencies.find(
      (currency) => currency.symbol === selectedCurrency
   );

   return (
      <div className="relative">
         {/* Selected currency button */}
         <button
            type="button"
            className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-50 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center">
               <span className="text-lg mr-2">{selected?.flag}</span>
               <span className="font-medium">{selected?.symbol}</span>
            </div>
            <svg
               className={`w-5 h-5 text-gray-400 transition-transform ${
                  isOpen ? "transform rotate-180" : ""
               }`}
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 20 20"
               fill="currentColor"
               aria-hidden="true">
               <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
               />
            </svg>
         </button>

         {/* Dropdown */}
         {isOpen && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
               <div className="py-1 max-h-60 overflow-auto">
                  {currencies.map((currency) => (
                     <div
                        key={currency.symbol}
                        className={`
                  flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer
                  ${selectedCurrency === currency.symbol ? "bg-purple-50" : ""}
                  ${!currency.available ? "opacity-50" : ""}
                `}
                        onClick={() => {
                           if (currency.available !== false) {
                              onSelect(currency.symbol);
                              setIsOpen(false);
                           }
                        }}>
                        <div className="flex items-center">
                           <span className="text-lg mr-2">{currency.flag}</span>
                           <div>
                              <span className="font-medium">
                                 {currency.symbol}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                 {currency.name}
                              </span>
                           </div>
                        </div>
                        {!currency.available && (
                           <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                              Coming Soon
                           </span>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};

export default CurrencySelector;
