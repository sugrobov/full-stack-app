import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1', // Явно указываем IPv4, чтобы Cypress мог подключиться
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-redux']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-redux']
  }
})