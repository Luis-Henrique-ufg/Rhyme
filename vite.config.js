import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // generateSW: Workbox automatically generates the SW from our config below.
      // The only custom SW is firebase-messaging-sw.js (handled separately).
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
        type: 'module',
      },

      // === OFFLINE PAGE ===
      // The offline fallback page is included in the precache manifest.
      includeAssets: ['offline.html', 'favicon-32x32.png', 'android-chrome-192x192.png', 'Logo.webp', 'Logo.png'],

      manifest: {
        name: 'Rhyme',
        short_name: 'Rhyme',
        description: 'Logística Acadêmica Inteligente',
        theme_color: '#121214',
        background_color: '#121214',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        // === NAVIGATION FALLBACK ===
        // SPA navigation fallback must point to index.html so client-side routes
        // (like /aluno, /motorista/dashboard) can be reloaded without being caught by offline.html
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/firebase-messaging-sw\.js/],

        // === CACHING STRATEGIES ===
        runtimeCaching: [

          // 1. OPENSTREETMAP / CARTO MAP TILES — CacheFirst (tiles rarely change)
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cartocdn',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 2. OSM TILES (fallback) — CacheFirst
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-osm',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 3. OSRM ROUTING API — StaleWhileRevalidate (routes can change, but old one is better than nothing)
          {
            urlPattern: /^https:\/\/router\.project-osrm\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osrm-routes',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 2, // 2 hours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 4. FIREBASE FIRESTORE REST API — NetworkFirst with 3s timeout
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-firestore',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 5. FIREBASE AUTH — NetworkFirst
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-auth',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 6. GOOGLE FONTS — CacheFirst
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // 7. IMGBB (Student photo uploads) — StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/i\.ibb\.co\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'student-photos',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    })
  ]
});

