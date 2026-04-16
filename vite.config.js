import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxmoxHost = env.VITE_PROXMOX_HOST || 'https://localhost:8006'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxmoxHost,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api2/json'),
        },
      },
    },
  }
})
