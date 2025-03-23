import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: "http://localhost:5000"
      },
      '/googleusercontent': {
        target: 'https://lh3.googleusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/googleusercontent/, '')
      }
    }
  },
  optimizeDeps: {
    exclude: ['@react-oauth/google']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
