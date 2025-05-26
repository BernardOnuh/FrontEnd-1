import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
   chains: [base],
   connectors: [injected()],
   transports: {
      8453: http("https://mainnet.base.org"),
   },
});
