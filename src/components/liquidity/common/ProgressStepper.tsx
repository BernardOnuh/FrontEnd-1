import React from "react";
import { ProcessStep } from "../../../types/LiquidityTypes";

interface Step {
   step: ProcessStep;
   label: string;
}

interface ProgressStepperProps {
   steps: Step[];
   currentStep: ProcessStep;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
   steps,
   currentStep,
}) => {
   // Find the index of the current step
   const currentIndex = steps.findIndex((step) => step.step === currentStep);

   return (
      <div className="w-full py-4">
         <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => {
               // Determine the status of each step
               const isCompleted = index < currentIndex;
               const isCurrent = index === currentIndex;

               return (
                  <div
                     key={step.step}
                     className="flex flex-col items-center relative">
                     {/* Step circle */}
                     <div
                        className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${
                     isCompleted
                        ? "bg-purple-600 text-white"
                        : isCurrent
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }
                  transition-all duration-300 ease-in-out
                `}>
                        {isCompleted ? (
                           <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20">
                              <path
                                 fillRule="evenodd"
                                 d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                 clipRule="evenodd"
                              />
                           </svg>
                        ) : (
                           <span>{index + 1}</span>
                        )}
                     </div>

                     {/* Step label */}
                     <span
                        className={`
                  mt-2 text-xs text-center
                  ${
                     isCurrent
                        ? "text-purple-600 font-semibold"
                        : "text-gray-500"
                  }
                `}>
                        {step.label}
                     </span>
                  </div>
               );
            })}
         </div>

         {/* Progress line */}
         <div className="relative mt-1">
            <div className="absolute top-0 h-1 w-full bg-gray-200 rounded"></div>
            <div
               className="absolute top-0 h-1 bg-purple-600 rounded transition-all duration-500 ease-in-out"
               style={{
                  width: `${(currentIndex / (steps.length - 1)) * 100}%`,
               }}></div>
         </div>
      </div>
   );
};

export default ProgressStepper;
