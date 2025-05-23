import { PrivyProvider } from "@privy-io/react-auth";
import { base } from "viem/chains";
import { ReactNode } from "react";

interface PrivyConfigProps {
   children: ReactNode;
}

const PrivyConfig = ({ children }: PrivyConfigProps) => {
   return (
      <PrivyProvider
         appId="cma3kpbef01uijy0mraydfase"
         config={{
            appearance: {
               theme: "dark",
               accentColor: "#7c3aed",
               logo: "/aboki-white.svg",
            },
            embeddedWallets: {
               createOnLogin: "users-without-wallets",
            },
            // Add Base network configuration
            defaultChain: base,
            supportedChains: [base],
         }}>
         {children}
      </PrivyProvider>
   );
};

export default PrivyConfig;
