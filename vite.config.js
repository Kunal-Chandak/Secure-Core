import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/room': 'http://localhost:3001',
      '/file': 'http://localhost:3001',
      '/file-drop': 'http://localhost:3001',
      '/ping': 'http://localhost:3001',
    },
  },
})
