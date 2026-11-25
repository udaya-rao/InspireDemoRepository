import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'inspire-magnetics-logo-1.png', 'apple-touch-icon.png'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2}'],
        globIgnores: ['**/*.msi'],              // don't precache installer blobs
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],   // never serve index.html for API calls
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://cdn.jsdelivr.net' ||
              url.origin === 'https://cdn.datatables.net' ||
              url.origin === 'https://code.jquery.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-assets',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },  // flip to true to test the SW with `vite dev`
    }),
  ],
  assetsInclude: ['**/*.msi'],
  server: {
    proxy: {
      '/api': {
        target: 'https://protectron-webapi.vusys.in:8181',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})