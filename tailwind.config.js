/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 機材の操作盤トークン (CSS変数経由) — docs/design-system/README.md が正。
      // 既存の gray/blue 等は壊さないよう、衝突しない名前で追加する。
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        panel: 'var(--panel)',
        glass: 'var(--glass)',
        'case-edge': 'var(--case-edge)',
        hair: 'var(--hair)',
        ink: 'var(--ink)',
        dim: 'var(--dim)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        correct: 'var(--correct)',
        wrong: 'var(--wrong)',
      },
      fontFamily: {
        // 署名: スタジオ機材の読み取り表示風。データ・音名・度数・数値は等幅。
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          'Meiryo',
          'sans-serif',
        ],
      },
      zIndex: {
        nav: '10',
        overlay: '40',
        modal: '50',
      },
    },
  },
  plugins: [],
}
