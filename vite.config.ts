import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";
  import path from "path";

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      exclude: ['@xenova/transformers']
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  });
  