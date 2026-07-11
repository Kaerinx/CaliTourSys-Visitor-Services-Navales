import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Set HTTPS=true to serve the dev server over self-signed HTTPS. Needed to test
// browser Geolocation from a phone on the LAN (Geolocation requires a secure
// context). Normal `npm run dev` stays on plain HTTP.
const useHttps = process.env.HTTPS === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    ...(useHttps ? [basicSsl()] : []),
  ],
  server: {
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mapbox-gl')) return 'mapbox'
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
