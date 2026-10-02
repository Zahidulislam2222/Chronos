import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
  },
  plugins: [react()],
  optimizeDeps: { entries: ["index.html"] },
  build: {
    // Vite 7's default browser floor. Vite 8 raised it to Safari/iOS 16.4, which
    // lets Lightning CSS emit range media queries (width<=640px) that Safari
    // before 16.4 ignores, dropping every responsive breakpoint there.
    target: ["chrome107", "edge107", "firefox104", "safari16", "ios16"],
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
