import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router")) {
              return "router";
            }
            if (id.includes("@tanstack/react-query")) {
              return "query";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            if (id.includes("react-dom") || id.includes("/react/")) {
              return "react";
            }
          }
        },
      },
    },
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});
