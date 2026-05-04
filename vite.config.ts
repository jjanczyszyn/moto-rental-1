import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Custom domain (moto.justinalydia.com) serves from root. Override via
  // VITE_BASE if you need to deploy under the github.io project subpath
  // (e.g. VITE_BASE=/moto-rental-1/).
  base: process.env.VITE_BASE ?? "/",
  server: { port: 5173, host: true },
});
