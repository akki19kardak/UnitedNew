import dns from "dns";
dns.setDefaultResultOrder("verbatim");

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["mappls-web-maps"],
  },
  build: {
    commonjsOptions: {
      include:  [/mappls-web-maps/, /node_modules/],
      // ✅ This tells Rollup to auto-detect CJS/ESM interop
      transformMixedEsModules: true,
    },
  },
  server: {
    host: "localhost",
    headers: {
      "Cross-Origin-Opener-Policy":   "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
});
