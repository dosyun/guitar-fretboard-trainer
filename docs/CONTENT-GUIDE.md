# コンテンツの書き方（指板トレーナー /fretboard/）

作成: 2026-10-27（site-content）／見本: `guides/memorize-fretboard/index.html`（P1-7）、`chords/f/index.html`・`chords/c/index.html`（P1-8）

アプリの画面ではなく、検索から来る人に読ませる静的ページ（読み物）を足すときの決まり。アプリの文言・英語化は `CLAUDE.md` と `src/i18n/` が正で、ここでは扱わない。

## 読者と、このサイトで増やしたいもの

- 読者: 「F コード 押さえ方」「指板 覚え方」のように、ギターの練習中に1つの疑問を持って日本語で検索してきた人
- 増やしたいもの: 読み物から指板トレーナー（`/fretboard/`）へ移って練習すること。読み物の最後には必ずツールへの入口を置く（見本: memorize-fretboard の「次に開くページ」）
- 書かないもの: 体験していない機材・教材の評価、アフィリエイトや広告（ハブの AGENTS.md、2026-10-07 運営者の決定で当面の非目的）

## 型と置き場所

| 種類 | 置き場所 | 作り方 |
|---|---|---|
| 1本ずつ書く読み物 | `guides/<スラッグ>/index.html` | 手書きの静的 HTML（見本: memorize-fretboard） |
| 同じ型で量産するページ | `chords/<スラッグ>/index.html` など | データ（`scripts/<種類>-pages/*.mjs`）から生成スクリプトで書き出す。生成物は直接編集しない（見本: `scripts/generate-chord-pages.mjs`） |

- スラッグは英小文字とハイフン。Windows でファイル名が衝突しないよう大文字を使わない（P1-8 仕様書）
- ページを足したら次の3か所に登録する
  - `vite.config.ts` の `rolldownOptions.input`
  - `scripts/generate-sitemap.mjs` の `japaneseOnly`（日本語だけのページ）
  - `src/i18n/metadata.test.ts` のサイトマップ件数
- 生成するデータは `src/` ではなく `scripts/` に置く。ビルド時の翻訳プラグインが `/src/` の日本語を辞書引きに書き換え、辞書に無い語で止まるため（P1-8 で実測）

## 形式

- 純粋な静的ページで、アプリ（`/src/`）を読み込まない。`<html lang="ja">`、h1 は1つ、自己参照の canonical、hreflang なし（英語版を作るまで）
- head には title・description・canonical・og 一式・favicon（`/fretboard/favicon.svg`）と、JSON-LD の Article（author は Organization「Guitar Toolbox」）と BreadcrumbList を入れる（見本2件で共通）
- CSS はページ内の `<style>` に書き、色・文字・余白は memorize-fretboard のトークンを写す。図は inline SVG で、文字は14px以上、`aria-label` に図の内容を文で書く（chords/*）
- 計測タグ（GA4）はビルド時に `vite.config.ts` の `transformIndexHtml` が入れる。ページに直接書かない

## 文体

- 文末は「です・ます」（見本3件）
- 見出し（h2）は名詞止めか、「〜とき」「〜する」の短い句。疑問形は FAQ の中だけ（見本3件）
- 冒頭: h1 の直後の1〜2段落で、検索した人の問いに先に答える（例: 押さえる場所と指）。前置きを置かない
- 避ける言い回し: 「〜しましょう」の連発、「簡単に」「誰でも」のような保証、太字の多用

## 構成の型

見本3件に共通する並びは次のとおり。

1. パンくず → h1 → 即答のリード
2. 本題（表・図で示す。数値や音名は表に置く）
3. ツールでやると何が楽になるか（入口のボタンつき）
4. よくある質問（`<dl>`、3〜5問）
5. 次に開くページ（同じ種類のページ、ほかの読み物、ツール）

## 事実と出典

- 本文の事実は、仕様書（ハブの `docs/site-backlog/specs/`）の「事実と出典」表に載せたものだけを使う
- 音名・度数・フレット・音程は出典を引かず、標準チューニングの開放弦（E A D G B E）から計算し、テストで検算する（`src/chordPages.test.ts`）
- 学習段階・目標値など、アプリの設定値を載せるときは、そう明記する（見本: memorize-fretboard の注記）

## 内部リンク

- このページへ: 同じ種類のページどうしと、既存の読み物の「次に開くページ」から張る
- このページから: ツール（`/fretboard/`）と、関連する読み物へ張る

## 成果リンク（アフィリエイト）

- 置かない（当面の非目的）

## 本人にしか書けないもの

- 練習の体験談・機材の評価は書かない。必要になったら `[NEED: 本人]` で空け、埋まるまで公開しない

## 検証と公開

- 検証: `npm run build` のあとに `npx vitest run` と `npm run lint`（エラー0）。ビルド前にテストを回すと、古い `dist/` を検査して落ちることがある
- 表示: `npm run preview` を開き、375px と 1280px で横はみ出しが0かを見る（preview は localhost で待ち受ける）
- 公開: `master` への push で Workers Builds が自動でビルド・公開する（約3分）。手元からの `npm run deploy` は計測タグなしで出るので使わない
