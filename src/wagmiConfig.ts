import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
   chains: [base],
   connectors: [injected()],
   transports: {
      [base.id]: http("https://base.llamarpc.com"), // uses default Base RPC, or you can provide a custom one like http('https://base.llamarpc.com')
   },
});
