import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Izinkan akses ke node_modules agar font icons bisa dimuat dengan benar
      allow: ['..']
    }
  }
})