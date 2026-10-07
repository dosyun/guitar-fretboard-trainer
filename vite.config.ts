import { copyFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { localizeSource } from './src/i18n/source'
import { dictionary } from './src/i18n'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const measurementId = loadEnv(mode, process.cwd(), 'VITE_GA_MEASUREMENT_ID')
    .VITE_GA_MEASUREMENT_ID?.trim()

  return {
    base: '/fretboard/',
    build: {
      outDir: 'dist/fretboard',
      rolldownOptions: { input: { ja: resolve('index.html'), en: resolve('en/index.html') } },
    },
    plugins: [
      {
        name: 'fretboard-ui-language',
        enforce: 'pre',
        transform(source, id) {
          const path = id.split('?')[0].replaceAll('\\', '/');
          if (!path.includes('/src/') || path.includes('/i18n/') || path.endsWith('.test.ts') || !/\.tsx?$/.test(path)) return;
          const localized = localizeSource(source, path);
          for (const key of localized.messages) {
            if (!(key in dictionary.en)) this.error(`Missing English UI text in ${path}: ${key}`);
          }
          return localized.code === source ? undefined : { code: localized.code, map: null };
        },
      } satisfies Plugin,
      {
        name: 'fretboard-worker-assets',
        apply: 'build',
        buildStart() {
          // 旧ビルドのルート index.html を含め、ビルド成果物だけを消す。
          rmSync(resolve('dist'), { recursive: true, force: true })
        },
        closeBundle() {
          // Workers は assets.directory の直下で _headers を読む。
          copyFileSync(resolve('public/_headers'), resolve('dist/_headers'))
          rmSync(resolve('dist/fretboard/_headers'), { force: true })
        },
      } satisfies Plugin,
      ...(measurementId ? [{
        name: 'fretboard-analytics',
        apply: 'build' as const,
        transformIndexHtml() {
          return [{
            tag: 'script',
            attrs: { src: '/fretboard/analytics.js', defer: true },
            injectTo: 'head' as const,
          }]
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'analytics.js',
            source: `(() => {
  const measurementId = ${JSON.stringify(measurementId)};
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(script);
})();\n`,
          })
        },
      } satisfies Plugin] : []),
      react(),
      VitePWA({
        // prompt: 新版検知時にトーストで明示更新（autoUpdateの「旧版を掴む」混乱を回避）
        registerType: 'prompt',
        scope: '/fretboard/',
        filename: 'sw.js',
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
          id: '/fretboard/',
          start_url: '/fretboard/',
          scope: '/fretboard/',
        },
        workbox: {
          cacheId: 'gft-fretboard',
          // 未知の URL はオンライン・オフラインともアプリへ置き換えない。
          navigateFallback: null,
          // フォントも同梱(woff2)なので precache に含まれオフライン対応。外部フォント取得なし。
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        },
      }),
      {
        name: 'fretboard-english-pwa',
        enforce: 'post',
        transformIndexHtml: {
          order: 'post',
          handler(html) {
            if (!html.includes('<html lang="en">')) return html;
            return html.replace(/<link\b[^>]*\brel=["']manifest["'][^>]*>/g, '')
              .replace('</head>', '<link rel="manifest" href="/fretboard/en/manifest.webmanifest" /></head>');
          },
        },
        generateBundle(_options, bundle) {
          const asset = bundle['manifest.webmanifest'];
          if (!asset || asset.type !== 'asset') this.error('Japanese manifest is missing');
          const source = typeof asset.source === 'string' ? asset.source : new TextDecoder().decode(asset.source);
          const manifest = JSON.parse(source) as { icons: { src: string; [key: string]: unknown }[] };
          this.emitFile({
            type: 'asset',
            fileName: 'en/manifest.webmanifest',
            source: JSON.stringify({
              ...manifest,
              name: 'Guitar Fretboard Trainer',
              short_name: 'Fretboard',
              description: 'Learn guitar fretboard notes and intervals with timed practice and a weakness heatmap.',
              lang: 'en',
              id: '/fretboard/en/',
              start_url: '/fretboard/en/',
              scope: '/fretboard/',
              icons: manifest.icons.map((icon) => ({
                ...icon, src: new URL(icon.src, 'https://guitartoolbox.site/fretboard/').pathname,
              })),
            }),
          });
        },
      } satisfies Plugin,
    ],
  }
})
