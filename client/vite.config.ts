import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load root .env (PORT, VITE_API_URL) — same file the server uses
  const env = loadEnv(mode, "..", "");
  const apiTarget =
    env.VITE_API_URL ||
    `http://localhost:${env.PORT || "3001"}`;

  return {
    envDir: "..",
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
