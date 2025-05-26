import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import PrivyConfig from "./PrivyConfig";
import { LiquidityProvider as LiquidityContextProvider } from "./context/LiquidityContext";
import { config } from "./wagmiConfig";
import { WagmiProvider } from "@privy-io/wagmi"; // Only import WagmiProvider

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <PrivyConfig>
         <QueryClientProvider client={queryClient}>
            <BrowserRouter>
               <WagmiProvider config={config}>
                  <LiquidityContextProvider>
                     <App />
                  </LiquidityContextProvider>
               </WagmiProvider>
            </BrowserRouter>
         </QueryClientProvider>
      </PrivyConfig>
   </StrictMode>
);
