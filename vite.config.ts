import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": "/src" },
  },
  optimizeDeps: {
    include: ["3dmol"],
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: ["arcivus.northprot.com"],
  },
});
