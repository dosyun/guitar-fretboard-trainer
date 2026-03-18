# CLAUDE.md

## プロジェクト概要

ギター指板の音名・度数を覚えるためのReact Webアプリ。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — TypeScriptチェック + 本番ビルド (`tsc -b && vite build`)
- `npm run lint` — ESLint実行
- `npm run preview` — ビルド結果のプレビュー

## アーキテクチャ

```
src/
├── types/index.ts          — 全型定義 (NoteName, FretPosition, QuizState等)
├── data/fretboard.ts       — 音名・度数の算出ロジック (MIDIノート番号ベース)
├── hooks/
│   ├── useQuiz.ts          — クイズ状態管理 (出題・正誤判定・ヒント)
│   └── useScore.ts         — スコア管理 (localStorage永続化)
├── components/
│   ├── Fretboard.tsx       — クイズ用SVGフレットボード (インタラクティブ)
│   ├── FretboardMap.tsx    — マップ表示用SVGフレットボード (全音名/度数表示)
│   ├── FretMarker.tsx      — フレット上の各ポジション円
│   ├── NoteSelector.tsx    — 音名回答ボタン (12音)
│   ├── IntervalSelector.tsx— 度数回答ボタン (R〜M7)
│   ├── ModeSelector.tsx    — クイズモード切替
│   ├── RootSelector.tsx    — ルート音選択 (度数モード用)
│   ├── ScoreBoard.tsx      — スコア表示
│   ├── SettingsPanel.tsx   — 設定 (#/♭切替、スコアリセット)
│   └── PracticeRangeSelector.tsx — 練習範囲の弦・フレット絞り込み
└── App.tsx                 — 全体統合 (マップビュー / クイズビュー)
```

## 重要な設計判断

- **MIDIノート番号ベース**: 弦index + フレット → MIDIノート → `% 12` で音名算出。異名同音の処理がシンプル。
- **弦の順序**: `types/index.ts` で `string: 0` = 6弦(低いE), `string: 5` = 1弦(高いE)。表示時に `stringY` で反転 (`5 - stringIndex`)。
- **SVG viewBox**: レスポンシブ対応。実際のピクセルサイズに関係なくviewBoxで座標管理。
- **Tailwind CSS v3**: Vite 8との互換性問題でv4は使えず、v3 + PostCSSを使用。

## スタイル

- Tailwind CSS 3 のユーティリティクラスを使用
- コンポーネント内にインラインでクラスを記述
