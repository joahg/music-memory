import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.PWA_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['music-memory-icon.svg'],
      manifest: {
        id: base,
        name: 'Music Memory Practice',
        short_name: 'Music Memory',
        description: 'Offline-friendly music memory practice with bundled excerpts and local progress tracking.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f5efe2',
        theme_color: '#123a3f',
        icons: [
          {
            src: 'music-memory-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{css,html,js,json,mp3,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true
      }
    })
  ]
})
