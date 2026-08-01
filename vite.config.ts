import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: {
      // Clean aliases for easier importing
      "@": path.resolve(__dirname, "./src"),
      "@artifacts": path.resolve(__dirname, "./artifacts"),
      "@ignition": path.resolve(__dirname, "./ignition"),
    },
  },
  server: {
    fs: {
      // Allow Vite to fetch JSON files from these directories
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
