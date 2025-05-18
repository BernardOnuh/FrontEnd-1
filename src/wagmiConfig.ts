import { http, createConfig } from "wagmi";
import { base, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
   chains: [sepolia],
   connectors: [injected()],
   transports: {
      11155111: http("https://sepolia.infura.io/v3/b894ec36518544e58c621047a61c9398"), // Using your Sepolia RPC URL
   },
});