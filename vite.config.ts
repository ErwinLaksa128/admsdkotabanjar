import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose to network
    port: 5173,
    strictPort: true, // Force to use port 5173 to match Google Console redirect URI
  },
  optimizeDeps: {
    include: ['xlsx-js-style']
  }
})
