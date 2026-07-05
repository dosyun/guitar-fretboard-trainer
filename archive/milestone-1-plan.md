# Milestone 1 実装計画 — 計測＋ヒートマップ

> 確定方針は [CONTEXT.md](../CONTEXT.md) と `docs/adr/` を参照。本書は M1 の実装ブレ止め。
> ゴール: **ダーク基盤＋1問ごとの計測ログ＋永続化＋結果画面＋指板ヒートマップ＋成績画面**。
> 「今日の練習」「弱点自動出題」「フェーズ表示」は M2（弱点データが溜まってから）。

---

## 0. キーストーン: データモデル

第一弾は既存3クイズ（`position-to-note` / `note-to-position` / `interval`）のみ計測。

```ts
// src/types/practice.ts （新規）
export type QuizType = 'position-to-note' | 'note-to-position' | 'interval';

export interface PracticeAttempt {
  id: string;            // crypto.randomUUID()
  sessionId: string;
  quizType: QuizType;
  isCorrect: boolean;
  responseTimeMs: number;
  string: number;        // 0-5 （target: 弦）
  fret: number;          // 0-maxFret （target: フレット）
  note?: NoteName;       // 音名認識のとき: そのセルの音
  rootNote?: NoteName;   // interval のとき
  degree?: IntervalName; // interval のとき
  createdAt: number;     // Date.now()
}

export interface SessionSummary {
  id: string;
  quizType: QuizType;
  mode: 'daily' | 'free';
  count: number;
  correct: number;
  avgMs: number;
  medianMs: number;
  startedAt: number;
  endedAt: number;
}

// ヒートマップ/弱点の集計（生ログを毎回走査しないため）
export interface CellStat {
  n: number;
  correct: number;
  sumMs: number;         // 平均算出用（中央値はセッション内のみ）
  lastAt: number;
}
// key = `${quizType}:${string}:${fret}`
```

**設計判断:**
- 生 `PracticeAttempt` は履歴用に保持するが、ヒートマップ/前回比は **集計（CellStat / SessionSummary）** から引く。毎レンダーで全ログ走査しない。
- 中央値は「セッション内」だけ算出（結果画面用）。全期間中央値は不要、平均で足りる（ヒートマップは平均速度＋誤答率）。
- 指板ヒートマップは **音名認識（position-to-note / note-to-position）のみ**。interval はログは取るが指板には混ぜない（[CONTEXT.md 出題対象](../CONTEXT.md) 参照）。

## 1. 永続化レイヤ

```
src/data/practiceStore.ts （新規）
```
- localStorage で開始。キー: `gft-attempts-v1`（生ログ・上限例: 直近2000件のローリング）、`gft-cellstats-v1`、`gft-sessions-v1`。
- API: `appendAttempt(a)` / `getCellStats(quizType?)` / `appendSession(s)` / `getLastSession(quizType)` / `getAllSessions()`。
- 量が増えたら IndexedDB へ移行（インターフェースを上記に閉じ込めておけば差し替え可能）。← 将来。

## 2. デザイン基盤（ダークトークン）

着手時に **frontend-design**（美学）と **baseline-ui**（トークン規律）を実行する。

- `src/index.css` に CSS変数でトークン定義（暫定値）:
  - `--bg:#0f1115` / `--surface:#1a1d24` / `--surface-2:#232730`
  - `--board:#2a2e37`（指板） / `--string:#9aa0aa`（弦・銀）
  - `--accent:#f5a623`（アンバー） / `--correct:#34d399`（エメラルド） / `--heat:#ef4444`（誤答・赤）
  - `--text:#e5e7eb` / `--text-dim:#9ca3af` / `--border:#323742`
- Tailwind `theme.extend.colors` を上記変数参照に。`:root` をダーク既定に。
- Ant `ConfigProvider` に `theme.darkAlgorithm` ＋ `token`（colorPrimary=アンバー, colorBgBase 等）。
- SVG指板の色は共通モジュール `src/data/boardPalette.ts`（新規）に集約し、Fretboard/FretboardMap/ScaleMap/CagedMap/VoicingDiagram が参照。
- baseline-ui に従いタイポ階調・余白スケール・モーション時間（150/200/300ms）を確定。

## 3. セッション化＋計測

- `src/hooks/useSession.ts`（新規, または useQuiz を内包）:
  - `sessionId`・`startedAt`・`config`（quizType, 範囲, daily/free, 目標数/秒）・セッション内 `attempts[]` を保持。
  - 出題提示時刻 `questionShownAt`（ref）を記録 → 回答時に `responseTimeMs = Date.now() - questionShownAt`。
  - 各回答で `appendAttempt` ＋ CellStat 更新（音名認識のみセル更新）。
  - 終了条件: daily=固定数/時間到達, free=ユーザー「終了」。終了で `SessionSummary` 算出・`appendSession`・結果画面へ。
- 既存 [useQuiz.ts](../src/hooks/useQuiz.ts) の回答ハンドラに計測フックを差す（`onCorrect/onWrong` を attempt 記録に拡張）。

## 4. 結果画面

```
src/components/ResultScreen.tsx （新規）
```
- 表示: 問題数 / 正答率 / 平均・中央値回答時間 / **前回比**（`getLastSession` と差分）/ そのセッションのミニヒートマップ。
- CTA: 「もう一回」「終了（ホームへ）」。

## 5. 指板ヒートマップ

```
src/components/FretboardHeatmap.tsx （新規, FretboardMap のジオメトリ流用）
```
- セル色: 不透明度 ∝ 平均回答時間（遅い=濃い）、色相 赤 ∝ 誤答率、未出題=無色。
- 対象: 音名認識（position-to-note + note-to-position）。quizType フィルタ可。

## 6. 成績画面＋ナビ再編

```
src/components/StatsPage.tsx （新規）
App.tsx       AppView を再編
```
- StatsPage: 全期間サマリ＋ヒートマップ＋最も苦手な音/弦/フレット範囲。
- ナビ: `home | practice | theory | stats | settings` の5タブへ。`theory` 配下に既存7ビュー（map/scale/caged/voicing/open/diatonic/arpeggio）をサブナビで収容。`practice` にセッション化したクイズ。
- **リスク最大なので最後**。結果/成績の置き場として最小限のシェルを先に用意し、全面再編は仕上げに。

---

## 着手順（依存関係）

| 順 | チケット | 依存 | 備考 |
|----|----------|------|------|
| T1 | タイトル/meta修正 | なし | [index.html:7](../index.html#L7)。1行 |
| T2 | デザイン基盤（ダークトークン） | なし | frontend-design / baseline-ui。以降の全画面の土台 |
| T3 | データ層（型＋practiceStore） | なし | キーストーン。不可視 |
| T4 | セッション化＋計測 | T3 | useSession、responseTimeMs |
| T5 | 結果画面 | T4 | 前回比 |
| T6 | 指板ヒートマップ | T3, T2 | 音名認識のみ |
| T7 | 成績画面 | T6 | サマリ＋苦手 |
| T8 | ナビ再編（Home中心） | T5, T7 | 最後。結果/成績の home を提供 |

> T1〜T3 は互いに独立（並行可）。T2 を早めに固めると以降が一貫したダーク見た目で作れる。

## M1 スコープ外（M2以降）

今日の練習カード / 弱点自動出題（弱点スコア重み付け）/ フェーズ到達マップ＋バッジ / 連続練習日数 / 度数の弱点別指標 / 新クイズ種別（コードトーン等）/ 設定拡張（チューニング・左利き・表記）/ サウンド・耳トレ・マイク。
