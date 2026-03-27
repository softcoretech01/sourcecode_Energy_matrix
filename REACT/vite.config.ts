import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/energymatrix/uat/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/energymatrix/uat/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/energymatrix\/uat/, ""),
      },
      "/energymatrix/uat/uploads": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/energymatrix\/uat/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));