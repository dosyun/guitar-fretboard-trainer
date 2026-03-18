# CLAUDE.md

## プロジェクト概要

ギター指板の音名・度数を覚えるためのReact Webアプリ。
Cloudflare Pages で自動デプロイ（GitHub master push → 即反映）。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — TypeScriptチェック + 本番ビルド (`tsc -b && vite build`)
- `npm run lint` — ESLint実行
- `npm run preview` — ビルド結果のプレビュー

## アーキテクチャ

```
src/
├── types/index.ts               — 全型定義 (NoteName, FretPosition, QuizState等)
├── data/
│   ├── fretboard.ts             — 音名・度数の算出ロジック (MIDIノート番号ベース)
│   ├── caged.ts                 — CAGEDフォームデータ
│   ├── scales.ts                — スケールデータ
│   └── voicings.ts              — コードボイシングデータ（後述）
├── hooks/
│   ├── useQuiz.ts               — クイズ状態管理 (出題・正誤判定・ヒント)
│   ├── useScore.ts              — スコア管理 (localStorage永続化)
│   ├── useCagedQuiz.ts          — CAGEDクイズ状態管理
│   └── useScaleQuiz.ts          — スケールクイズ状態管理
├── components/
│   ├── Fretboard.tsx            — クイズ用SVGフレットボード (インタラクティブ)
│   ├── FretboardMap.tsx         — マップ表示用SVGフレットボード (全音名/度数表示)
│   ├── FretMarker.tsx           — フレット上の各ポジション円
│   ├── NoteSelector.tsx         — 音名回答ボタン (12音)
│   ├── IntervalSelector.tsx     — 度数回答ボタン (R〜M7)
│   ├── ModeSelector.tsx         — クイズモード切替
│   ├── RootSelector.tsx         — ルート音選択 (度数モード用)
│   ├── ScoreBoard.tsx           — スコア表示
│   ├── SettingsPanel.tsx        — 設定 (#/♭切替、スコアリセット)
│   ├── PracticeRangeSelector.tsx— 練習範囲の弦・フレット絞り込み
│   ├── CagedMap.tsx             — CAGED指板マップ
│   ├── CagedFormSelector.tsx    — CAGEDフォーム選択
│   ├── CagedLegend.tsx          — CAGED凡例
│   ├── CagedQuiz.tsx            — CAGEDクイズ
│   ├── ScaleMap.tsx             — スケールマップ
│   ├── ScaleQuiz.tsx            — スケールクイズ
│   ├── VoicingPage.tsx          — バレーコードボイシング一覧（6/5/4弦ルート）
│   ├── VoicingDiagram.tsx       — SVGコードダイアグラム（共通コンポーネント）
│   ├── OpenChordPage.tsx        — オープンコード一覧（カテゴリフィルタ付き）
│   └── HelpPage.tsx             — 使い方説明
└── App.tsx                      — 全体統合・タブ管理
```

## タブ構成 (AppView)

`'map' | 'quiz' | 'scale' | 'caged' | 'voicing' | 'open' | 'help'`

- **指板マップ**: 全フレット音名/度数表示。練習範囲絞り込み可。
- **クイズ**: 音名・位置・度数の3モード。
- **スケール**: ペンタ/マイナー等のスケールマップ＋クイズ。
- **CAGED**: CAGEDフォームの指板マップ＋クイズ。
- **ボイシング**: バレーコードボイシング（6/5/4弦ルート × 6コードタイプ）。
- **オープン**: オープンコード32種（7カテゴリ）。
- **使い方**: ヘルプページ。

## VoicingDiagram — 重要な設計

### サイズ定数（現在値）
```typescript
const STRING_SPACING = 76;
const FRET_SPACING = 84;
const PADDING_TOP = 76;
const PADDING_LEFT = 60;
const PADDING_RIGHT = 40;
const PADDING_BOTTOM = 24;
const DOT_R = 32;
```

### OPEN_STRINGS（重要: 6弦→1弦の順）
```typescript
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E (mod12)
```
**注意**: 過去に `[4,11,7,2,9,4]`（逆順）というバグがあった。修正済み。

### baseFret計算（バレーコード用）
```typescript
const rootStringIdx = voicing.frets.findIndex(f => f === 0);
const rootOpenNote = OPEN_STRINGS[rootStringIdx];
let baseFret = (rootIdx - rootOpenNote + 12) % 12;
if (baseFret === 0) baseFret = 12;
actualFrets = voicing.frets.map(offset =>
  offset === 'x' ? 'x' : baseFret + (offset as number)
);
```

### absolute モード（オープンコード用）
`absolute={true}` を渡すとbaseFret計算をスキップし、fretsをそのまま絶対フレット番号として使用。

### displayMode
- `'note'`: 音名表示
- `'degree'`: 度数表示
- `'both'`: 上段=音名(white)、下段=度数(水色 #93c5fd)

### 開放弦の扱い
```typescript
const hasOpenString = actualFrets.some(f => f === 0);
const startFret = hasOpenString ? 1 : minFret; // ナット表示
```

## voicings.ts — ボイシングデータ

### フォーマット
`frets: [6弦, 5弦, 4弦, 3弦, 2弦, 1弦]`
値はルートフレットからの**相対オフセット**。`'x'` = ミュート。

### VOICINGS_6TH（6弦ルート）
**ジャズ教本ベース。5弦・1弦は省略（x）のボイシングを使用。**
現在のデータ（更新中）:
```typescript
{ type: 'm7',    frets: [0, 'x', 0, 0, 0, 'x'] },  // 6,4,3,2弦同フレット = R,♭7,♭3,5
```

### VOICINGS_5TH（5弦ルート）
`['x', 0, ?, ?, ?, ?]` 形式のAフォーム系。

### VOICINGS_4TH（4弦ルート）
`['x', 'x', 0, ?, ?, ?]` 形式のDフォーム系。

### OPEN_CHORDS（オープンコード）
`absolute: true` で使用。フレット番号は絶対値。32種、7カテゴリ:
`major(5) / minor(3) / 7(6) / M7(5) / m7(3) / sus(7) / add9(6)`

## 重要な設計判断

- **MIDIノート番号ベース**: 弦index + フレット → MIDIノート → `% 12` で音名算出。異名同音の処理がシンプル。
- **弦の順序**: `string: 0` = 6弦(低いE), `string: 5` = 1弦(高いE)。表示時に反転。
- **SVG viewBox**: レスポンシブ対応。実際のピクセルサイズに関係なくviewBoxで座標管理。
- **Tailwind CSS v3**: Vite 8との互換性問題でv4は使えず、v3 + PostCSSを使用。
- **Ant Design**: タブ(`AntTabs`)、トグル(`Segmented`)、スイッチ(`Switch`)に使用。

## スタイル

- Tailwind CSS 3 のユーティリティクラスを使用
- コンポーネント内にインラインでクラスを記述
