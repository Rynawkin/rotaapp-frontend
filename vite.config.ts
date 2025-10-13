import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true
    },
    proxy: {
      '/api': {
        target: 'https://api.yolpilot.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
})// Build timestamp:  2 Eki 2025 Per 12:09:27
