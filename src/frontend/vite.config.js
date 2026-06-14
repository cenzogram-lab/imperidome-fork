import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

const ii_url =
  process.env.DFX_NETWORK === "local"
    ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8081/`
    : `https://identity.internetcomputer.org/`;

process.env.II_URL = process.env.II_URL || ii_url;
process.env.STORAGE_GATEWAY_URL =
  process.env.STORAGE_GATEWAY_URL || "https://blob.caffeine.ai";

export default defineConfig({
  logLevel: "error",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
  },
  css: {
    postcss: "./postcss.config.js",
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  define: (() => {
    let envJsonCanisterId = '';
    // Try project root first (../../env.json relative to src/frontend/vite.config.js)
    // then fall back to ./env.json for local dev setups
    const envJsonPaths = ['../../env.json', './env.json'];
    for (const p of envJsonPaths) {
      try {
        const envJson = require(p);
        const raw =
          envJson.backend_canister_id ||
          envJson.CANISTER_ID_BACKEND ||
          '';
        if (raw && raw !== 'undefined') {
          envJsonCanisterId = raw;
          break;
        }
      } catch (_) {}
    }
    const canisterId =
      process.env.CANISTER_ID_BACKEND ||
      process.env.VITE_CANISTER_ID_BACKEND ||
      envJsonCanisterId ||
      '';
    if (!canisterId) {
      console.warn(
        '[vite.config.js] WARNING: VITE_CANISTER_ID_BACKEND is not set. ' +
        'window.backend will not initialize in production. ' +
        'Ensure env.json exists at the project root with a backend_canister_id field.'
      );
    }
    return {
      // Inject as import.meta.env so Vite replaces it correctly in the browser bundle
      'import.meta.env.VITE_CANISTER_ID_BACKEND': JSON.stringify(canisterId),
      // Also keep process.env replacement for SSR/Node contexts
      'process.env.VITE_CANISTER_ID_BACKEND': JSON.stringify(canisterId),
    };
  })(),
  envPrefix: ['CANISTER_', 'DFX_', 'VITE_'],
  plugins: [
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    environment(["II_URL"]),
    environment(["STORAGE_GATEWAY_URL"]),
    react(),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent"]
  },
});
