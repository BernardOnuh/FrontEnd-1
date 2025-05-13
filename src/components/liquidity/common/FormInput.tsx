import React from "react";
import { Field, ErrorMessage } from "formik";

interface FormInputProps {
   label: string;
   name: string;
   type?: string;
   placeholder?: string;
   disabled?: boolean;
   required?: boolean;
   maxLength?: number;
   autoComplete?: string;
   className?: string;
   hint?: string;
   icon?: React.ReactNode;
   iconPosition?: "left" | "right";
}

const FormInput: React.FC<FormInputProps> = ({
   label,
   name,
   type = "text",
   placeholder = "",
   disabled = false,
   required = false,
   maxLength,
   autoComplete,
   className = "",
   hint,
   icon,
   iconPosition = "left",
}) => {
   return (
      <div className={`mb-4 ${className}`}>
         <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
         </label>

         <div className="relative">
            {icon && iconPosition === "left" && (
               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  {icon}
               </div>
            )}

            <Field
               id={name}
               name={name}
               type={type}
               placeholder={placeholder}
               disabled={disabled}
               maxLength={maxLength}
               autoComplete={autoComplete}
               className={`
            block w-full rounded-md border-gray-300 shadow-sm
            focus:border-purple-500 focus:ring-purple-500 
            disabled:bg-gray-100 disabled:text-gray-500
            sm:text-sm transition-all duration-200
            ${icon && iconPosition === "left" ? "pl-10" : ""}
            ${icon && iconPosition === "right" ? "pr-10" : ""}
          `}
            />

            {icon && iconPosition === "right" && (
               <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  {icon}
               </div>
            )}
         </div>

         {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}

         <ErrorMessage
            name={name}
            component="div"
            className="mt-1 text-sm text-red-600"
         />
      </div>
   );
};

export default FormInput;
