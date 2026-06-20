import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "web",
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    host: true, // bind 0.0.0.0 so the dev server is reachable from outside the container
    port: 5173,
    // "/api/" (avec slash) pour ne PAS proxifier des modules comme /api-client.ts vers l'API
    proxy: { "/api/": "http://localhost:3000" },
    // file events from a bind mount often don't propagate in Docker -> polling in the dev container
    watch: { usePolling: process.env.VITE_USE_POLLING === "true" },
  },
});
