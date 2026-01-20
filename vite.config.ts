import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/**/*', 'audio/**/*', 'beatmaps/**/*'],
      manifest: {
        name: '湯切りますたー',
        short_name: '湯切り',
        description: 'ラーメン店主のリズムゲーム - Rhythm of Ramen Master',
        theme_color: '#1a0f0a',
        background_color: '#1a0f0a',
        display: 'standalone',
        orientation: 'landscape',
        scope: '/ramen-master/',
        start_url: '/ramen-master/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // オフラインキャッシュ設定
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,mp3,json}'],
        runtimeCaching: [
          {
            // 画像キャッシュ
            urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            // 音声キャッシュ
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
            },
          },
          {
            // 譜面JSONキャッシュ
            urlPattern: /beatmaps\/.*\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'beatmaps-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
              },
            },
          },
        ],
      },
    }),
  ],
  base: '/ramen-master/',
})
