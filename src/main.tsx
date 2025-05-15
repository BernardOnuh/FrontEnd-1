import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import PrivyConfig from "./PrivyConfig";
import { LiquidityProvider as LiquidityContextProvider } from "./context/LiquidityContext";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmiConfig";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <QueryClientProvider client={queryClient}>
         <BrowserRouter>
            <WagmiProvider config={config}>
               <PrivyConfig>
                  <LiquidityContextProvider>
                     <App />
                  </LiquidityContextProvider>
               </PrivyConfig>{" "}
            </WagmiProvider>
         </BrowserRouter>
      </QueryClientProvider>
   </StrictMode>
);
