# プロジェクト経緯（ヒストリー / 変更ログ）

このアプリがどう作られてきたかの記録。現在の状態は [CLAUDE.md](../CLAUDE.md)、
方針は [CONTEXT.md](../CONTEXT.md)、個別の設計判断は [docs/adr/](adr/) を参照。
本書は「完了した計画・監査・リリース」を1本に要約したもの。原本は [archive/](../archive/) に退避。

---

## 0. 出発点 — 「練習エンジン化」への転換

当初は指板の音名・度数を扱う理論ビューア＋クイズだった。外部レビュー（[archive/chatgpt.md](../archive/chatgpt.md)）で
「機能を横に足すとビューアになるが、練習アプリとしての上達実感・継続率が弱い」と指摘され、
**「指板を見て考えるアプリ」→「指板を反射で使えるようにするトレーニングOS」** へ舵を切った。
中核は **「弱点を計測し、次の練習を最適化する」** こと。方針の確定版は [CONTEXT.md](../CONTEXT.md) と
[docs/adr/](adr/)（0001 練習エンジンへの転換 / 0002 ソフトガイド / 0003 ダーク＋antd維持）。

## 1. マイルストーン1 — 計測＋ヒートマップ（完了）

原本: [archive/milestone-1-plan.md](../archive/milestone-1-plan.md)

- データモデル `src/types/practice.ts`（PracticeAttempt / SessionSummary / CellStat）。
- 永続化 `src/data/practiceStore.ts`（localStorage、生ログ＋集計）。
- ダーク・スタジオ系のデザイン基盤（トークン、`boardPalette.ts`、antd darkAlgorithm）。
- 1問ごとの回答時間計測（`useSession`）、結果画面（前回比）、指板ヒートマップ（音名認識のみ）、成績画面。
- ナビを `home | practice | theory | stats | settings` の5タブへ再編。

## 2. マイルストーン2 — 弱点エンジン＋習慣化（完了）

- 弱点自動出題（`pickWeightedPosition`、配分 弱点60/復習30/新規10）。
- 今日の練習・連続練習日数、フェーズ到達マップ、指板習熟度（Mastery）、弱点ドリル導線。
- 新クイズ種別（コードトーン / 進行 / トライアド / キー機能 / 耳トレ / ガイド音）、音（Web Audio）。
- 理論「学ぶ」レッスン路（全21レッスン）、スキルマップ、弱点診断（MistakeClinic）。

## 3. ブラッシュアップ第1弾（2026-07・リリース済み）

原本: 監査 [archive/site-audit-2026-07.md](../archive/site-audit-2026-07.md) / TODO [archive/brushup-todo.md](../archive/brushup-todo.md)

12観点（戦略/UX/UI/コンテンツ/SEO/性能/a11y/モバイル/CRO/信頼性/保守性/法令）で全面監査し、
`master` へリリース（Cloudflare Pages 自動デプロイ）。主な変更:

- **計測の正確性（実バグ修正）**: quizType をモード別に分離し度数統計・前回比のクロスコンタミを根絶。
  表記「両方」で派生音が正解不能だったバグを修正（ピッチクラス比較）。連続日数を全モードで計上。
  Home/Stats の指標を `getOverallStats`（完了セッション基準）に統一。結果画面に最小試行数ガード。
- **信頼性**: ルート ErrorBoundary、練習データの JSON バックアップ（書き出し/読み込み）、
  `public/_headers`（CSP 他）、プライバシー明記。
- **a11y**: 指板セルを role=button＋aria-label＋キーボード操作可に、出題文を aria-live、正誤を✓/✕記号でも表示。
- **情報設計 / UI**: Home を「次の一手」に絞り込み、主ナビをボトムナビ化、回答ボタンを単色化（1ビュー1色）、
  苦手表現を MistakeClinic＋ヒートマップに一本化。
- **性能**: code-splitting（理論/成績/専門クイズを遅延ロード）＋フォント同梱で初期JS 658→501KB（gzip 202→161KB）。
- **コンテンツ**: レッスン→練習の導線を全モード対応に拡充、About ページ。
- **保守性**: vitest＋CI（lint/test/build）、未使用依存6件とデッド ui/ 層を削除、
  6クイズの共通chrome（QuizFooter / QuizScore）を抽出。
- **弱点ドリル拡張**: MistakeClinic の弦診断・フレット帯診断にもドリルボタン。

### 見送った項目（意図的）
- SEO のレッスンURL化＋prerender（ルーター導入の大改修・リグレッションリスク、かつ「練習アプリ」では
  費用対効果が疑問。OGP/JSON-LD/PWA は同梱済み）。sitemap は本番ドメイン確定が前提。
- 度数ドリル / TriadBuilder のセッション統合 / demo 補完（1問1答モデルや demo フォーマットに馴染みにくい）。

### 残タスク（デプロイ後）
- 本番サイトのコンソールで CSP 違反が出ていないか確認（`_headers` は本番でのみ適用）。
- OGP の `og:url`/canonical を本番ドメインの絶対URLにし、専用の 1200×630 画像を用意。
