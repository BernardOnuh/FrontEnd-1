import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import PrivyConfig from "./PrivyConfig";
import { LiquidityProvider as LiquidityContextProvider } from "./context/LiquidityContext";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <BrowserRouter>
         <PrivyConfig>
            <LiquidityContextProvider>
               <App />
            </LiquidityContextProvider>
         </PrivyConfig>
      </BrowserRouter>
   </StrictMode>
);
