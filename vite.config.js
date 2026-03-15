/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables so VITE_API_BASE_URL can be used in Vite config
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || '';

  return {
    plugins: [react()],
    server: {
      proxy: apiBase
        ? {
            // If a base URL is configured, proxy under the same origin to the backend
            '/room': apiBase,
            '/file': apiBase,
            '/file-drop': apiBase,
            '/ping': apiBase,
          }
        : {
            // Local dev default
            '/room': 'http://localhost:3001',
            '/file': 'http://localhost:3001',
            '/file-drop': 'http://localhost:3001',
            '/ping': 'http://localhost:3001',
          },
    },
  };
})
