# CLAUDE.md

## プロジェクト概要

ギター指板の音名・度数を**反射で使えるようにする練習トレーナー**(React Web/PWA)。
単なる理論ビューアではなく、1問ごとに回答時間を計測し、弱点をヒートマップで可視化する
「練習エンジン」が中核（方針は [CONTEXT.md] と `docs/adr/`、計画は [docs/milestone-1-plan.md]）。
UIは**ダーク・スタジオ系**（エボニー指板＋白蝶貝インレイ＋琥珀アクセント、等幅データ表示）。
Cloudflare Pages で自動デプロイ（GitHub master push → 即反映）。

## コマンド

- `npm run dev` — 開発サーバー起動
- `npm run build` — TypeScriptチェック + 本番ビルド (`tsc -b && vite build`)
- `npm run lint` — ESLint実行
- `npm run preview` — ビルド結果のプレビュー

## アーキテクチャ

```
src/
├── types/
│   ├── index.ts                 — 基本型 (NoteName, FretPosition, QuizState等)
│   └── practice.ts              — 練習エンジンの型 (PracticeAttempt/SessionSummary/CellStat/AttemptInput)
├── data/
│   ├── fretboard.ts             — 音名・度数の算出ロジック (MIDIノート番号ベース)
│   ├── boardPalette.ts          — ★指板SVGのダーク共通パレット (BOARD / MARKER)
│   ├── practiceStore.ts         — ★練習ログ永続化 (localStorage, セル集計, セッション)
│   ├── caged.ts / scales.ts / voicings.ts — CAGED/スケール/ボイシングデータ
├── hooks/
│   ├── useQuiz.ts               — クイズ状態 (出題・正誤・ヒント・★回答時間計測/onAttempt/stop)
│   ├── useSession.ts            — ★セッション管理 (record/finalize/前回比用SessionSummary)
│   ├── useScore.ts              — ライブスコア (連続/最高、localStorage)
│   ├── useCagedQuiz.ts / useScaleQuiz.ts — CAGED/スケールクイズ状態
├── components/
│   ├── HomePage.tsx             — ★ホーム (練習CTA＋進捗readout＋弱点ティーザー)
│   ├── ResultScreen.tsx         — ★セッション結果画面 (前回比)
│   ├── StatsPage.tsx            — ★成績 (サマリ＋ヒートマップ＋苦手TOP5)
│   ├── FretboardHeatmap.tsx     — ★弱点ヒートマップ (音名認識, 緑→琥珀→赤)
│   ├── Fretboard.tsx / FretboardMap.tsx / FretMarker.tsx — クイズ/マップ用SVG指板
│   ├── NoteSelector / IntervalSelector / ModeSelector / RootSelector — 回答・選択UI
│   ├── ScoreBoard / SettingsPanel / PracticeRangeSelector — スコア/設定/範囲絞り込み
│   ├── CagedMap / CagedFormSelector / CagedLegend / CagedQuiz — CAGED系
│   ├── ScaleMap / ScaleQuiz — スケール系
│   ├── VoicingPage / VoicingDiagram — ボイシング (SVGコードダイアグラム)
│   ├── OpenChordPage / DiatonicPage / ArpeggioPage — オープン/ダイアトニック/アルペジオ
│   └── HelpPage.tsx             — 使い方説明 (設定タブ内に格納)
└── App.tsx                      — 全体統合・5タブ＋理論サブナビ管理
```

★ = M1「練習エンジン化」で追加・拡張（[docs/milestone-1-plan.md]）。

## タブ構成 (AppView) — Home中心5タブ

`'home' | 'practice' | 'theory' | 'stats' | 'settings'`（[docs/adr/0003] のIA）

- **ホーム (home)**: 練習CTA＋進捗readout（累計/正答率/平均反応）＋弱点ティーザー。
- **練習 (practice)**: 音名・位置・度数の3モードクイズ。セッション制（終了で結果画面）。
- **理論 (theory)**: `TheoryTab` サブナビ（横スクロールのピル）で7リファレンス表示を集約:
  指板マップ / スケール(8種) / CAGED / ボイシング / オープン(32種) / ダイアトニック / アルペジオ。
- **成績 (stats)**: 総合サマリ＋指板ヒートマップ（音名認識の弱点）＋苦手ポジションTOP5。
- **設定 (settings)**: #/♭切替・フレット数・スコアリセット＋使い方ガイド（トグル）。

`TheoryTab = 'map' | 'scale' | 'caged' | 'voicing' | 'open' | 'diatonic' | 'arpeggio'`

## 練習エンジン (M1) — 重要な設計

### データモデル ([types/practice.ts])
- **PracticeAttempt**: 1問の記録。`responseTimeMs`・`string`・`fret`・`note/rootNote/degree`・`createdAt`。
- **SessionSummary**: セッション要約（count/correct/avgMs/medianMs）。結果画面の**前回比**に使う。
- **CellStat / CellMetrics**: ヒートマップ・弱点用の `(quizType, string, fret)` 集計（生ログを毎回走査しない）。

### 計測フロー
1. `useQuiz` が出題提示時刻 `questionShownAt` を記録 → 回答時に `responseTimeMs` を算出し `onAttempt` 発火。
2. `useSession.record()` が `practiceStore.recordAttempt()` で永続化＋セッションに積む。
3. 「終了」で `finalize()` → SessionSummary 算出・保存 → ResultScreen（前回比）。

### 出題対象 (target) と ヒートマップ
- **指板ヒートマップは音名認識(position-to-note / note-to-position)のみ**。target=`(string,fret)`。
- 度数(interval)はルート依存なのでセルに混ぜない（ログは取る）。詳細は [CONTEXT.md] の「出題対象」。
- 色: 弱点(=誤答率0.6＋遅さ0.4)を 緑(習得)→琥珀(要練習)→赤(苦手)、未出題=無色。

### 弱点自動出題 (M2)
`practiceStore.pickWeightedPosition()` が弱点スコア順で出題対象を選ぶ。配分 **弱点60% / 復習30% / 新規10%**。
`useQuiz` の出題生成で音名認識(position-to-note / note-to-position)に適用。度数(interval)は一様のまま。
記録ゼロの範囲では `null` を返し一様ランダムにフォールバック。練習画面に「弱点を優先して出題中」を表示。

### permanenceとリセット
- 永続化は `practiceStore` に閉じ込め（キー `gft-attempts-v1 / gft-cellstats-v1 / gft-sessions-v1`）。
  量が増えたら IndexedDB へ差し替え可能。`useScore` の連続/最高は別キー。

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
- `'both'`: 上段=音名、下段=度数
- ※ダーク化済み: rootドット=琥珀(暗文字)、非rootドット=冷グレー#3a3a42(白文字)。色は `boardPalette` 方針に準拠。

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
```typescript
{ type: '7',   frets: [0, 'x', 0, 1, 0, 'x'] },
{ type: 'M7',  frets: [0, 'x', 1, 1, 0, 'x'] },
{ type: 'm7',  frets: [0, 'x', 0, 0, 0, 'x'] },
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
- **Ant Design (ダーク)**: タブ/トグル/スイッチに使用。`main.tsx` の `ConfigProvider` で
  `theme.darkAlgorithm` ＋ 琥珀primary。撤去せずトークンで上書き（[docs/adr/0003]）。
- **SVG指板の色は `boardPalette.ts` に集約**（BOARD/MARKER）。各指板SVGはここを参照。

## デザイントークン (ダーク・スタジオ系)

`src/index.css` の CSS変数 ＝ `tailwind.config.js` のカスタムカラー。**素材メタファ**で命名:
- `--bg #0e0f12`(背景) / `--surface #1b1813`(エボニー指板=カード面) / `--panel #232019`(一段上)
- `--hair #322c22`(境界) / `--ink #ece5d6`(白蝶貝=主テキスト) / `--dim #9c9384`(副次)
- `--accent #f5a623`(アンプ琥珀=唯一のアクセント) / `--accent-soft #3a2c12`(選択背景)
- `--correct #46c98b` / `--wrong #ef5350`(状態色)

Tailwindクラス: `bg-surface bg-panel bg-bg border-hair text-ink text-dim text-accent bg-accent bg-accent-soft text-bg text-correct text-wrong` 等。

### 規律 (frontend-design / baseline-ui)
- **署名**: スタジオ機材の読み取り表示風。データ(音名/度数/数値/回答時間)は等幅 `font-mono`(DM Mono)＋`tabular-nums`。
- グラデーション禁止、アクセントは1ビュー1色、`min-h-dvh`、`size-*`(正方形)、`prefers-reduced-motion` 配慮。
- アニメーションは明示要求時のみ＋compositorプロパティ(transform/opacity)・≤200ms。
- スタイルはTailwindユーティリティをコンポーネント内インラインで記述（既存方針）。
