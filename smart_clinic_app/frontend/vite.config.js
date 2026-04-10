import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // any request that starts with /api will be forwarded to the target
      '/api': {
        target: 'http://localhost:5000', // Your Express backend server
        changeOrigin: true,
      },
    },
  },
})