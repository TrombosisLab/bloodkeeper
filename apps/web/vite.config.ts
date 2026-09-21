import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const runtimeAllowedHosts = (process.env.BLOODKEEPER_VITE_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: runtimeAllowedHosts,

    proxy: {
      '/api': {
        target: 'http://api:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
