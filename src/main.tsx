import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import { getLanguage } from './i18n'
// フォントは同梱（セルフホスト）。外部CDNへの取得＝IP送信とレンダーブロックを避ける。
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// 練習記録(localStorage)を消えにくくする（特にiOS）。Service Workerは vite-plugin-pwa が自動登録。
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => { /* noop */ })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConfigProvider
        locale={getLanguage() === 'en' ? enUS : jaJP}
        theme={{
          algorithm: theme.darkAlgorithm,
          // antd は派生色を計算するため CSS変数ではなく実値が要る。値は src/index.css の :root と同じ
          // （docs/design-system/README.md のトークン表）。
          token: {
            colorPrimary: '#ffb02e',
            colorBgBase: '#121315',
            colorBgContainer: '#1f2124',
            colorBgElevated: '#2a2d31',
            colorBorder: '#34373c',
            colorText: '#ebe7df',
            colorTextSecondary: '#979aa0',
            borderRadius: 8,
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </ErrorBoundary>
  </StrictMode>,
)
