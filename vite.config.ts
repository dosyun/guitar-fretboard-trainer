import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // prompt: 新版検知時にトーストで明示更新（autoUpdateの「旧版を掴む」混乱を回避）
      registerType: 'prompt',
      // app-icon.svg から各サイズ（pwa/maskable/apple-touch/favicon）を生成・head注入
      pwaAssets: {
        image: 'public/app-icon.svg',
        preset: 'minimal-2023',
      },
      manifest: {
        name: 'Guitar Fretboard Trainer',
        short_name: 'Fretboard',
        description: 'ギター指板の音名・度数を反射で覚える練習トレーナー',
        lang: 'ja',
        theme_color: '#0e0f12',
        background_color: '#0e0f12',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        // フォントも同梱(woff2)なので precache に含まれオフライン対応。外部フォント取得なし。
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
