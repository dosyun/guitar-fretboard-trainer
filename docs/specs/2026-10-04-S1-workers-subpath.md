---
id: 2026-10-04-S1-fretboard
title: Workers の静的アセットへ移し、独自ドメインの /fretboard/ で配信する（段階1）
status: approved
owner: codex
decision: docs/adr/0004-one-domain-subdirectory.md
pair:
  - C:\workspace\guitartoolbox\docs\specs\2026-10-04-S1-hub.md
  - C:\workspace\guitar-player\docs\specs\2026-10-04-S1-domain-hub-measurement.md
---

# Workers の静的アセットへ移し、独自ドメインの /fretboard/ で配信する（段階1）

## 目的
ADR-0004 を実装する。`https://guitartoolbox.site/fretboard/` でアプリと PWA が動き、`/fretboard/sitemap.xml` があり、GA4 で計測でき、旧 URL から 301 で移り、旧 URL のデータを書き出せる状態にする。
ハブ・`/robots.txt`・`/sitemap.xml`（sitemap index）は guitartoolbox リポジトリの担当で、このリポジトリでは作らない。

## 着手条件（運営者の操作。すべて済むまで status は draft のまま）
- `guitartoolbox.site`（ムームードメインで取得済み）を Cloudflare にゾーンとして追加し、ムームードメインのネームサーバー設定を Cloudflare が指定する2つに変え、Cloudflare 上でゾーンが Active になった
- GA4 の測定 ID を控えた（ドメイン共通のもの。2026-10-04 にプロパティ作成済み。リポジトリには書かない）
- guitartoolbox のハブが `https://guitartoolbox.site/` で公開されている（ルートを先に載せると、ハブが無いあいだ `/` が応答しないため）
- 旧 URL の成績・設定を、アプリの書き出し機能で JSON に保存した

## やること
1. Vite の `base` を `/fretboard/`、ビルド出力を `dist/fretboard/` にする。
2. PWA（vite-plugin-pwa）の manifest の `scope`・`start_url`・`id` を `/fretboard/` にし、Service Worker を `/fretboard/sw.js`・登録範囲 `/fretboard/` で出す。Workbox のキャッシュ名に `gft-` を付ける。navigateFallback を使う場合は `/fretboard/` 配下に限る。
3. `index.html` の favicon・アイコン・og:image などの参照を base に追従させる（`/favicon.svg` のような直書きを残さない）。canonical（`https://guitartoolbox.site/fretboard/`）と og:url を足す。
4. `location.pathname` を使っている `src/components/SettingsPanel.tsx` と `src/components/ErrorBoundary.tsx` を、`/fretboard/` 配下で正しく動くように直す（再読込・リセット後の遷移先が `/` にならないこと）。
5. `wrangler.jsonc` を新規作成する。assets のみの Worker（`main` なし）、assets の directory は `./dist`、`not_found_handling` は `404-page` または `none`（SPA フォールバックにしない）、routes に `{ "pattern": "guitartoolbox.site/fretboard/*", "zone_name": "guitartoolbox.site" }`。`/fretboard`（末尾スラッシュなし）も `/fretboard/` に届くよう、routes に `guitartoolbox.site/fretboard` も加えるか、`html_handling` で正規化する。
6. `public/_headers` の CSP とキャッシュ設定を `/fretboard/*` のパスで効くように直す。GA4 に必要なドメインだけ許可を足す。HTML と `sw.js` は再検証、ハッシュ付き資産は長期キャッシュにする。
7. `/fretboard/sitemap.xml` をビルドで出す（段階1は `/fretboard/` の1件）。
8. GA4 のタグを入れる。測定 ID は `VITE_GA_MEASUREMENT_ID` から読み、未設定ならタグを出さない。
9. 旧 URL 用の `legacy-redirect/` ディレクトリを作る（ADR-0004「旧 URL」節の `_redirects`・`export.html`・`sw.js`）。`export.html` の出力は `src/data/backup.ts` の読み込みでそのまま取り込める形式にする。
10. package.json に `deploy`（`npm run build && wrangler deploy`）と `deploy:check`（`--dry-run`）を足す。AGENTS.md の「公開手段」と context/STATUS.md を新しい配信方法に合わせて直す。

## やらないこと
- 機能ごとの URL・説明文（段階2）と英語版（段階3）
- 保存キー・保存形式の変更、自動のデータ移行
- 練習ロジック・画面デザインの変更
- Cloudflare ダッシュボードの操作（Pages のビルド設定の変更、Workers の初回デプロイ、DNS）は運営者が行う

## 変更してよいファイル
- vite.config.ts、index.html、package.json、wrangler.jsonc（新規）、public/_headers
- src/components/SettingsPanel.tsx、src/components/ErrorBoundary.tsx、GA4 のタグを入れるためのファイル（src/main.tsx など）
- sitemap を出すための新規ファイル、legacy-redirect/（新規）
- AGENTS.md の公開手段の記述、context/STATUS.md、テスト

## 受け入れ条件
- `npm run build`・`npm test`・`npm run lint` が通る。`npx wrangler deploy --dry-run` が通る
- dist に `fretboard/index.html`・`fretboard/sw.js`・`fretboard/manifest.webmanifest`・`fretboard/sitemap.xml` があり、JS/CSS/アイコンは `dist/fretboard/` 配下にある。dist 直下に `index.html` が無い（guitartoolbox のハブと衝突しない）
- `npx wrangler dev` で次が成り立つ（Playwright CLI で実測）
  - `/fretboard/` が 200 で開き、5タブ・練習・統計が動く。資産の取得に 404 が無い
  - `/fretboard/no-such-page` は 404
  - Service Worker の scope が `/fretboard/`、manifest の scope と start_url が `/fretboard/`
  - 設定のリセットとエラー画面からの復帰で `/fretboard/` に戻る
  - 書き出した JSON を読み込むと成績が戻る
- `legacy-redirect/export.html` で書き出した JSON を、新しいアプリの読み込みで取り込める（ローカルで2つのオリジンを立てて実測）
- `VITE_GA_MEASUREMENT_ID` 未設定のビルドに gtag が含まれない
- 本番反映後（運営者と実施）: 旧 URL の `/` が `https://guitartoolbox.site/fretboard/` へ 301、`/export.html` と `/sw.js` は 200。新 URL で PWA をインストールでき、オフラインで開ける。GA4 のリアルタイムに自分のアクセスが出る

## 運営者の操作（実装後）
Pages は master への push で自動ビルドされる。この変更を push すると、旧 URL が `base: /fretboard/` のビルドに置き換わって壊れるため、push より先に 3 を済ませるか、作業ブランチのまま 1〜2 を済ませてから 3 と push を同時に行う。
1. `npm run deploy` で Workers に初回デプロイし、ルート `guitartoolbox.site/fretboard/*` が有効か確かめる
2. 新 URL で JSON を読み込み、成績が戻ったことを確かめる
3. Pages プロジェクト guitar-fretboard-trainer のビルド設定を、ビルドコマンドなし・出力 `legacy-redirect` に変える
