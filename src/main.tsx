import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
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
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#f5a623',
            colorBgBase: '#0e0f12',
            colorBgContainer: '#1b1813',
            colorBgElevated: '#232019',
            colorBorder: '#322c22',
            colorText: '#ece5d6',
            colorTextSecondary: '#9c9384',
            borderRadius: 10,
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
