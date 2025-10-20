// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
   plugins: [react()],
   optimizeDeps: {
      exclude: ["lucide-react"],
   },
   server: {
      proxy: {
         "/api": {
            target: "https://web3nova-payment-gate.onrender.com",
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api/, ""),
         },
      },
   },
});
