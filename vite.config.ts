import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages project site. Override via VITE_BASE for forks.
  base: process.env.VITE_BASE ?? "/moto-rental-1/",
  server: { port: 5173, host: true },
});
