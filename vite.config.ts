import { defineConfig } from "vite";
import { resolve } from "path";

const isAdmin = process.env.VITE_ADMIN_MODE === "true";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        analysis: resolve(__dirname, "src/analysis/index.html"),
        // admin is never bundled into the public build
      },
    },
  },
  server: {
    // Proxy /api to Express when running in admin mode
    ...(isAdmin && {
      proxy: {
        "/api": { target: "http://localhost:3001", changeOrigin: false },
      },
    }),
  },
  resolve: {
    alias: {
      "@admin": resolve(__dirname, "src/admin"),
      "@": resolve(__dirname, "src"),
    },
  },
});