// @lovable.dev/vite-tanstack-config@0.0.1 only bundles tailwind + tsconfig paths.
// TanStack Start SSR requires tanstackStart + viteReact explicitly (full Lovable config adds these in newer versions).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      srcDirectory: "src",
      // Use src/server.ts (SSR error wrapper) instead of the default server entry.
      server: { entry: "server" },
    }),
    viteReact(),
    nitro(),
  ],
  vite: {
    server: {
      port: 8086,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  },
});
