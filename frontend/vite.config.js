import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), mkcert()],
    server: {
      https: true,
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://localhost:8080',
          changeOrigin: true,
          secure: false, 
        }
      }
    },
  };
});
