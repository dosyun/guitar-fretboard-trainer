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

## PWA（インストール/オフライン）

- `vite-plugin-pwa`(workbox) で `manifest.webmanifest` ＋ Service Worker を生成（`registerType: 'autoUpdate'`、`registerSW.js` 自動登録）。`npm run build` 時に precache 一式を生成。
- アイコンは `public/app-icon.svg`（指板＋琥珀の音）から `@vite-pwa/assets-generator`(minimal-2023) で全サイズ生成（pwa-192/512・maskable-512・apple-touch-icon-180・favicon）。
- Googleフォントは workbox の runtimeCaching(CacheFirst) でオフライン対応。
- iOS は Safari の共有 →「ホーム画面に追加」でスタンドアロン起動。`status-bar-style: black-translucent` ＋ セーフエリア(`env(safe-area-inset-*)`)対応。`main.tsx` で `navigator.storage.persist()` を要求（iOSの記録消失対策）。
- 設定は `vite.config.ts` の `VitePWA({...})`。将来 Capacitor で同コードをストア配信可能（WebViewなので書き換え不要）。

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
- **練習 (practice)**: 上部に「基本／コードトーン」トグル。
  - **基本**: 音名・位置・度数の3モード。**チャレンジ**=問題数(10/20/50/∞)・純ランダム・規定数で自動終了→**100%でクリア判定**。直近6問は重複回避。
  - **コードトーン**: `ChordToneQuiz`。ルート＋コードタイプ(major/m/7/maj7/m7/m7♭5、`data/chords.ts`)を選び「◯◯コードの△度を選べ」を指板でタップ。構成音をヒント表示。
  - **進行**: `ChordProgressionQuiz`。キー＋進行(ii-V-I/I-vi-ii-V/i-iv-V/ブルース、`PROGRESSIONS`)を選び、進行を巡回して各コードのターゲット音を押さえる。現在コードを進行ストリップで強調。
  - ※コードトーン/進行は現状は独立クイズで、練習エンジンのログ/Masteryには未連動。
- **理論 (theory)**: `TheoryTab` サブナビ（横スクロールのピル）。
  - **学ぶ**: `LessonsPage`＋`data/lessons.ts`。全19レッスンを7章に段階化(初級: 1.音と度数 / 2.スケール / 3.コード / 4.キーと進行、中級: 5.コード機能と発展(機能T-SD-D/セカンダリードミナント/代理コード) / 6.響きの拡張(モード/テンション)、上級: 7.上級テクニック(モード使い分け/リハーモナイズ/転調))。章→レベルは `CHAPTER_LEVEL`(初級/中級/上級)で一覧・レッスンに色付きバッジ表示。各レッスン=**説明＋例＋`LessonFretboard`の盤面実演（入力）→ 理解度チェック多肢選択＋解説（確認）→ 練習への導線(`onGoto`)**。進捗は `lessonProgress`(localStorage `gft-lessons-v1`)で保存し一覧に✓/「N/19完了」バー、「学んだ→次へ」で完了マーク。**章クリアで「✓ クリア」、全完走で🎉バナー**。「ちゃんと学んでからクイズ」でゼロベースでも“なんじゃこれ”にしない。理論は“読ませず”見て・確かめて練習に繋ぐ(docs/adr/0001)。
    **学び→実践の循環**: Home「音楽理論を学ぶ」＋練習(度数/コードトーン/進行)の「まず学ぶ→」(`goToLearn`)で本コースへ誘導、各レッスンの導線で練習へ戻る。Homeは未完了の続きを「次のレッスン: ◯◯ →」で表示し `goToLearn(lessonId)`→`LessonsPage` の `openLessonId` でそのレッスンを直接開く。
  - リファレンス表示: 指板マップ / スケール(8種) / CAGED / ボイシング / オープン(32種) / ダイアトニック / アルペジオ。各上部に1行解説(`THEORY_INTRO`)で“調べる”を“分かる”に。
- **成績 (stats)**: 総合サマリ＋推移グラフ(セッション折れ線:正答率/平均反応)＋指板ヒートマップ＋苦手ポジションTOP5＋度数の弱点。
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
- 成績で **総合/誤答/遅さ** を切替（`FretboardHeatmap` の `metric` prop）。「間違える場所」と「知ってるが遅い場所」は練習法が違うため区別できる。

### 弱点自動出題 (M2)
`practiceStore.pickWeightedPosition()` が弱点スコア順で出題対象を選ぶ。配分 **弱点60% / 復習30% / 新規10%**。
`useQuiz` の出題生成で音名認識(position-to-note / note-to-position)に適用。度数(interval)は一様のまま。
記録ゼロの範囲では `null` を返し一様ランダムにフォールバック。
**弱点優先は今日の練習/フェーズ(adaptive=true)のみ**。チャレンジ(自由練習)は純ランダム。
`useQuiz.start(...,adaptive)` で切替、出題は `buildQuestion` 経由で直近6問の重複を回避(`recentKeys`)。
度数モードも `pickWeightedIntervalPosition` で弱点優先（**度数=R..M7 を単位**に集計=`getDegreeMetrics`、
キー `gft-degreestats-v1`）。成績ページに「度数の弱点」バー（緑→琥珀→赤）を表示。

### 今日の練習 / 連続日数 (M2)
HomePageの「今日の練習をはじめる」→ 固定35問(`DAILY_COUNT`)・位置→音名・弱点優先のデイリーセッション
(`dailyTarget` state)。規定数に達すると `useEffect` で自動終了→結果。途中で「終了」も可。
完了(handleEnd)で `recordPracticeDay()` が連続練習日数を更新、Homeに「連続N日」(`getStreak`)表示。
モード/範囲を手動変更すると `dailyTarget` 解除＝自由練習に戻る。

### Mastery Score / 指板習熟度 (M2)
`src/data/mastery.ts`: `cellMastery(0-100)=accuracy*0.5+speed*0.35+recency*0.05+confidence*0.1`
（提案のconsistencyは分散データ無しのため回数confidenceで代替）。`getMasterySummary(maxFret, accidental)` が
盤面全セル平均(未出題=0)の `overall%` と、音ごとの `top`(得意)/`weak`(次に練習) を返す。
`MasteryBar` をホーム(compact)と成績(得意/次つき)に表示。成長が見える単一指標＋「次はこれ」断定。

### 弱点ドリル導線 — ループを閉じる (M2)
結果画面(`ResultScreen`)とStatsPageの「苦手ポジション」から、弱点の音を **その場で1タップ練習**できる。
- `ResultScreen` は `getNoteRecognitionMetrics()` から最弱セル(n>=2, 弱点スコア最大)を算出し「一番弱い: ◯弦◯F（音）」＋主CTA「『音』を10問だけ練習」を表示。
- StatsPageの苦手TOP5は各行がボタン（タップでその音を練習）。
- `App.handleStartDrill(note, count=10)`: `noteFilter:[note]`・全盤・**note-to-position**・challengeで起動（「その音を探す」ドリル）。
- 狙い: 練習→結果→弱点→その場で潰す→改善、のループを閉じる。

### フェーズ到達マップ (M2)
HomePageの「学習マップ」。`phases.ts` の `PHASES`(5フェーズ)を `computePhaseStatus` で進捗・クリア判定
（CellStat/度数の記録から導出、**非永続**）。フェーズ=練習範囲のプリセット＋到達目標(正答率/平均反応)。
タップで範囲(弦/フレット/音名/モード)をセットし練習開始、範囲内は弱点エンジンが駆動。**ロックなし**(ADR0002)、
クリアでバッジ。`useQuiz.start()` に scope override 引数を追加し、起動初回の stale 範囲を回避。

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
