import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5177,
    strictPort: true,
    // The browser talks to our backend on the same origin; the backend keeps
    // the Vibe-Trading API key and proxies the agent stream.
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
