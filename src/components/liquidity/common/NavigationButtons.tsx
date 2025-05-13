import React from "react";

interface NavigationButtonsProps {
   onNext?: () => void;
   onBack?: () => void;
   onCancel?: () => void;
   nextLabel?: string;
   backLabel?: string;
   cancelLabel?: string;
   nextDisabled?: boolean;
   loading?: boolean;
   hideBack?: boolean;
   hideCancel?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
   onNext,
   onBack,
   onCancel,
   nextLabel = "Next",
   backLabel = "Back",
   cancelLabel = "Cancel",
   nextDisabled = false,
   loading = false,
   hideBack = false,
   hideCancel = true,
}) => {
   return (
      <div className="flex justify-between items-center mt-6 w-full">
         <div className="flex space-x-4">
            {!hideBack && (
               <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all">
                  {backLabel}
               </button>
            )}

            {!hideCancel && (
               <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all">
                  {cancelLabel}
               </button>
            )}
         </div>

         <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || loading}
            className={`
          px-4 py-2 rounded-md text-sm font-medium text-white 
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2
          ${
             nextDisabled || loading
                ? "bg-purple-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
          }
        `}>
            {loading ? (
               <div className="flex items-center">
                  <svg
                     className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                     xmlns="http://www.w3.org/2000/svg"
                     fill="none"
                     viewBox="0 0 24 24">
                     <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                     <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
               </div>
            ) : (
               nextLabel
            )}
         </button>
      </div>
   );
};

export default NavigationButtons;
