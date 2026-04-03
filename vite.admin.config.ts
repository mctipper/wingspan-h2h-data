import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});