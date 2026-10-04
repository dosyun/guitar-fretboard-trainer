# 0004 — 独自ドメインの /fretboard/ へ移し、Cloudflare Pages から Workers の静的アセットへ切り替える

---
status: accepted
date: 2026-10-04
---

Guitar Fretboard Trainer と Guitar Practice Looper（`C:\workspace\guitar-player`）を1つの独自ドメイン `guitartoolbox.site`（2026-10-04 取得、ギター練習ツールの道具箱として今後もツールを足す）にまとめ、このアプリは `https://guitartoolbox.site/fretboard/` で配信する。
全体の決定（ハブ、sitemap の分担、計測、言語パス、進める順序）は guitar-player の `docs/adr/0007-one-domain-subdirectory.md` が正で、ここにはこのアプリに固有の決定だけを書く。
需要の根拠は affiliate-brain `context/FINDINGS.md` §84（guitar fretboard 18,100/月、guitar fretboard notes 8,100/月、guitar caged system 4,400/月 など、米国、2026-10-04 実測）。

## 決定

- 配信を Cloudflare Pages から、assets のみの Worker（Workers の静的アセット）へ移し、ゾーンのルート `guitartoolbox.site/fretboard/*` に載せる。Pages のカスタムドメインはホスト名単位でしか付けられず、パスで振り分けられないため。
- Vite の `base` を `/fretboard/`、ビルド出力を `dist/fretboard/` にし、assets の directory は `dist` にする。
- PWA は manifest の `scope`・`start_url` と、Service Worker のファイル位置（`/fretboard/sw.js`）と登録範囲（`/fretboard/`）をすべて `/fretboard/` にそろえる。manifest の scope だけでは Service Worker の制御範囲は変わらない。Workbox のキャッシュ名には `gft-` を付け、同じオリジンの guitar-player とぶつけない。
- 全体への SPA フォールバックは使わない。`/fretboard/` 配下の未知のパスは 404 にする（段階2で機能ごとの URL を足すときは、その URL の HTML を個別に出す）。
- 成績・設定は既存の書き出し／読み込み（`src/data/backup.ts`）で移す。自動移行はしない。

## 旧 URL（guitar-fretboard-trainer.pages.dev）

- Pages プロジェクトは残し、出力を `legacy-redirect/` ディレクトリ（ビルドなし）に切り替える。中身は次の3つ。
  - `_redirects`: 下の2ファイル以外を `https://guitartoolbox.site/fretboard/` へ 301
  - `export.html`: 旧オリジンの localStorage にある `gft-` で始まるキーを、`backup.ts` が読み込める形式の JSON として保存させる単独ページ
  - `sw.js`: 旧 PWA を片付ける Service Worker（キャッシュを全削除し、自身を登録解除し、開いている画面を再読込する）。旧 PWA の利用者が再訪したときに古いキャッシュ版が出続けないようにする
- Service Worker のスクリプト取得は転送できないため、`sw.js` は転送の対象外にする。

## 検討して採らなかった案

- **サブドメインで Pages のまま配信**: 手間は最も少ないが、guitar-player の ADR-0007 でサブディレクトリに決めたため不採用。
- **Pages を Router Worker の後ろに置いて中継する**: 全リクエストが Worker 実行になり、pages.dev 側の重複コンテンツも残るため不採用。

## 結果として生じること

- GitHub の master への push で Pages に自動反映する流れは、旧 URL 用の `legacy-redirect/` の配信に変わる。新しい配信は `wrangler deploy`（または Workers の Git 連携）で行う。
- 旧 URL でインストールした PWA は新 URL へ自動では移らない。新 URL で入れ直してもらう。
