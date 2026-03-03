import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/fast-dem-trini/',
  plugins: [react()],
  resolve: {
    alias: {
      child_process: fileURLToPath(new URL('./src/utils/emptyModule.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          deckgl: ['@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox', '@deck.gl/geo-layers'],
          maplibre: ['maplibre-gl'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
