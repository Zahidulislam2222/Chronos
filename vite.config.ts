import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { loadAssistantConfig, protocol } from "./scripts/assistant/config.mjs";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      [protocol.message.slice(0, protocol.message.lastIndexOf("/"))]: {
        target: `http://${loadAssistantConfig().bindHost}:${loadAssistantConfig().port}`,
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  optimizeDeps: { entries: ["index.html"] },
  build: {
    // Match the CSS framework's supported browser floor.
    target: ["chrome111", "edge111", "firefox128", "safari16.4", "ios16.4"],
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "motion",
              test: /node_modules[\\/](framer-motion|motion-[^\\/]+)[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}));
