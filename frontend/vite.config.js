import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
      },
      '/images': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/download': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      }
    }
  }
})