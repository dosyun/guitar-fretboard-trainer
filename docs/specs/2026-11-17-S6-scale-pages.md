---
id: 2026-11-17-S6-scale-pages
title: スケール別ページの試作（C メジャー・ドリアンの日英4URL）
status: ready
owner: codex（生成スクリプトとテスト）／Claude（本文の照合・検収・記録）
source: guitartoolbox docs/site-backlog/specs/2026-10-07-P2-4-scale-pages-prototype.md
---

# スケール別ページの試作（C メジャー・ドリアンの日英4URL）

## 要約

「キー名・スケール名 × ギター」の検索に、1語1ページの静的ページで届くかを試す。
C メジャースケールとドリアンの2種類を、日本語版と英語版の対で作る（計4URL）。
ページの中身はデータから生成し、各弦の音名・度数は開放弦からの計算で出してテストで検算する。
量産はしない。公開3週後に順位を見て、量産するかを決める（ハブの P2-4）。

2026-11-17 に運営者が「P1-8（コード別ページ）の再判定 2026-12-22 を待たずに進める」と指示した。

## 対象の語とページ

| URL | 言語 | 狙う語 | 月間検索数 | 難易度 |
|---|---|---|---|---|
| `/fretboard/scales/c-major/` | ja | Cメジャースケール ギター | 720 | 20 |
| `/fretboard/en/scales/c-major/` | en | c major scale guitar | 9,900（US） | 9 |
| `/fretboard/en/scales/dorian/` | en | dorian mode guitar | 2,400（US） | 1 |
| `/fretboard/scales/dorian/` | ja | （対の日本語版。参考: ドリアン スケール ギター） | 140 | 19 |

- 出典: ラッコ 2026-10-07（requestId 1299903・1299904）、日本語の2語は 2026-11-17 の headline（各3クレジット）の summary
- 語とスラッグは 2026-10-24 に運営者が確定（ハブ P2-4「対象の語と置き場所」）
- 既定で決めたこと（2026-11-17）:
  - G メジャー（US 6,600）は足さない。試作の判定前に本数を増やさないため
  - ドリアンの例は **D ドリアン**にする。C メジャーと同じ7音で、2ページを「同じ音を別の音から数えると度数が変わる」でつなげられるため。他のキーへは「移す表」で動かす

## 付け足す価値

上位ページ（日本語: ラッコ headline 2026-11-17、英語: web-researcher 2026-11-17）は、スケール辞典型のツール（a-ki's factory）、指板全体に音名・度数を並べた図（放課後トミータイム）、5ポジションの指板図とジャム音源（guitarscale.org・fretjam）、理論の読み物（ギター・マガジン・ギター博士）だった。

どれも **ポジションごとに、6本の弦それぞれで押さえるフレット・音名・度数を表にしていない**。練習ツールへの入口があるページも無い（閲覧用の指板ツールだけ）。

このページだけが出せるもの:

1. 3つのポジション（開放・5弦ルート・6弦ルート）ごとに、弦1本ずつ「押さえるフレット・音名・度数」の表を、開放弦からの計算で出す
2. 12キーで「ルートが6弦・5弦の何フレットにあるか」の表で、同じ形を他のキーへ動かせる
3. C メジャーと D ドリアンは同じ7音で、度数の数え方だけが変わることを、同じポジションの表を並べて示す
4. 指板トレーナーの「理論」→「スケール」で同じ音を全指板で表示し、スケールの音当て（ScaleQuiz）で覚えたかを確かめられる

## 共食いの確認

- `/theory/major-minor-scale/`（メジャースケールとは、6弦・5弦ルートの形、平行調）と `/theory/modes/`（モード7つの比較、ドリアンの特性音、合うコード）は概念の説明で、狙う語は「メジャースケールとは」「モード とは」。このページは「C のキーで指板のどこを弾くか」に絞る
- 日本語のドリアン版は `/theory/modes/` と近いので、本文で理論を繰り返さず、「なぜそうなるか」は `/theory/modes/` へリンクで送る
- guitar-flet 内に同じ意図のページは無い（`guides/memorize-fretboard/` は指板の音名の覚え方、`chords/*` はコードの押さえ方）

## ポジションの決め方（計算の定義）

標準チューニングの開放弦（6弦→1弦: E2 A2 D3 G3 B3 E4、MIDI 40・45・50・55・59・64）にフレット数を足して音を出し、スケールの音だけを残す。

| ポジション | フレット範囲 | C メジャー | D ドリアン |
|---|---|---|---|
| 開放 | 0〜3 | 0〜3 | 0〜3 |
| 5弦ルート | 5弦のルートのフレット r5 として r5−1〜r5+2 | 2〜5（r5=3） | 4〜7（r5=5） |
| 6弦ルート | 6弦のルートのフレット r6 として r6−1〜r6+2 | 7〜10（r6=8） | 9〜12（r6=10） |
| 全体図 | 0〜12 | 0〜12 | 0〜12 |

- 各ポジションに7つの度数がすべて含まれることを、生成スクリプトで確かめる（欠けたら生成を止める）
- 度数の記号はアプリ（`src/data/scales.ts`）と同じ: メジャーは R・2・3・4・5・6・7、ドリアンは R・2・m3・4・5・6・m7。長い名前は日本語「ルート・長2度・短3度…」、英語「root・major 2nd・minor 3rd…」
- 手で数えた期待値（テストで照合する。弦ごとに「フレット:音名/度数」）:

C メジャー・開放（0〜3）

| 弦 | 音 |
|---|---|
| 6 | 0:E/3 1:F/4 3:G/5 |
| 5 | 0:A/6 2:B/7 3:C/R |
| 4 | 0:D/2 2:E/3 3:F/4 |
| 3 | 0:G/5 2:A/6 |
| 2 | 0:B/7 1:C/R 3:D/2 |
| 1 | 0:E/3 1:F/4 3:G/5 |

C メジャー・5弦ルート（2〜5）: 6弦 3:G/5 5:A/6／5弦 2:B/7 3:C/R 5:D/2／4弦 2:E/3 3:F/4 5:G/5／3弦 2:A/6 4:B/7 5:C/R／2弦 3:D/2 5:E/3／1弦 3:G/5 5:A/6

C メジャー・6弦ルート（7〜10）: 6弦 7:B/7 8:C/R 10:D/2／5弦 7:E/3 8:F/4 10:G/5／4弦 7:A/6 9:B/7 10:C/R／3弦 7:D/2 9:E/3 10:F/4／2弦 8:G/5 10:A/6／1弦 7:B/7 8:C/R 10:D/2

D ドリアン・開放（0〜3）: 6弦 0:E/2 1:F/m3 3:G/4／5弦 0:A/5 2:B/6 3:C/m7／4弦 0:D/R 2:E/2 3:F/m3／3弦 0:G/4 2:A/5／2弦 0:B/6 1:C/m7 3:D/R／1弦 0:E/2 1:F/m3 3:G/4

D ドリアン・5弦ルート（4〜7）: 6弦 5:A/5 7:B/6／5弦 5:D/R 7:E/2／4弦 5:G/4 7:A/5／3弦 4:B/6 5:C/m7 7:D/R／2弦 5:E/2 6:F/m3／1弦 5:A/5 7:B/6

D ドリアン・6弦ルート（9〜12）: 6弦 10:D/R 12:E/2／5弦 10:G/4 12:A/5／4弦 9:B/6 10:C/m7 12:D/R／3弦 9:E/2 10:F/m3 12:G/4／2弦 10:A/5 12:B/6／1弦 10:D/R 12:E/2

- 他のキーへ移す表: 12キー（C・C♯/D♭・D・E♭・E・F・F♯/G♭・G・A♭・A・B♭・B）について、6弦と5弦のルートのフレット（0〜11、0 のときは 12 も併記）。ドリアン版は「D ドリアン → A ドリアンなら6弦5フレット」のように読み方の例を1行添える

## ページの構成

CONTENT-GUIDE の「構成の型」に合わせる。日英で同じ構成、本文は各言語で書く（機械的な直訳にしない）。

1. パンくず → h1 → 即答のリード（構成音7つと、まず弾く位置）
   - 例（日本語・C メジャー）: h1「C メジャースケールのギターでの弾き方｜3つのポジションと各弦の音」。リードは「C メジャースケールは C D E F G A B の7音（ドレミファソラシ）です。最初は開放弦を使う0〜3フレットで弾き、次に5弦3フレット・6弦8フレットのルートから始まる形へ広げます。」
   - 例（英語・dorian）: h1「Dorian Mode on Guitar: D Dorian in 3 Positions, String by String」
2. 構成音の表（音名・度数・半音数）。ドリアン版は C メジャーとの違い（同じ音、R の位置が違う）と、ナチュラルマイナーとの違い（6が長6度）を1〜2文
3. 全体図（0〜12フレット、横向き SVG、ルートを色で区別、丸の中に度数、下に音名）
4. ポジション3つ: 各ポジションに SVG の図と、弦1本ずつの表（弦・押さえるフレット・音名・度数）
5. 他のキーへ移す表
6. 指板トレーナーで練習する（「理論」→「スケール」で同じ音を表示、スケールの音当てで確かめる。入口のボタン）
7. よくある質問（`<dl>`、3〜4問。例: 「C メジャーと A マイナーは何が違う？」「ドリアンはどのコードの上で弾く？」→ 答えは「事実と出典」の範囲だけ）
8. 次に開くページ: もう1つのスケールのページ（同じ言語）、日本語版は `/theory/modes/`・`/theory/major-minor-scale/`・`/fretboard/guides/memorize-fretboard/`、英語版は `/fretboard/en/`

## 事実と出典

音名・度数・フレット・半音数は出典を引かず計算で出し、テストで検算する。本文の文で述べる事実は次の表のものだけを使う。

| 事実 | 出典 | 取得日 | 抜粋・該当箇所 |
|---|---|---|---|
| メジャースケールの音程は R から 0・2・4・5・7・9・11 半音、度数の記号は R 2 3 4 5 6 7 | guitar-flet `src/data/scales.ts` `SCALES.major` | 2026-11-17 | `intervals: [0, 2, 4, 5, 7, 9, 11]`, `degreeLabels: ['R', '2', '3', '4', '5', '6', '7']` |
| ドリアンの音程は 0・2・3・5・7・9・10 半音、記号は R 2 m3 4 5 6 m7 | 同 `SCALES.dorian` | 2026-11-17 | `intervals: [0, 2, 3, 5, 7, 9, 10]`, `degreeLabels: ['R', '2', 'm3', '4', '5', '6', 'm7']` |
| C メジャーの音を D から並べると D ドリアン（同じ7音） | guitar-flet `src/data/lessons.ts` 308〜310行、`/theory/modes/`（guitar-theory `content/articles/modes.md` 26行） | 2026-11-17 | 「例: Cメジャーの音を D から弾くと D ドリアン」「Dから並べればDドリアン」 |
| ドリアンはマイナーだが6度が長い（長6度を持つ） | guitar-flet `src/data/lessons.ts` 307・319行、`modes.md` 16行 | 2026-11-17 | 「マイナーっぽいが6度が長い」「ドリアンはマイナーに6」 |
| Dm7 の上ではドリアン、G7 の上ではミクソリディアンを選ぶ | `modes.md` 17行 | 2026-11-17 | 「Dm7 ならドリアン、G7 ならミクソリディアンを選ぶ」 |
| メジャースケールは全全半全全全半の間隔 | guitar-theory `content/articles/major-minor-scale.md` description | 2026-11-17 | 「メジャースケールは全全半全全全半…の間隔で並ぶ7音」 |
| 指板トレーナーの「理論」→「スケール」で、スケールの音を指板に表示し、スケールの音当てで練習できる | guitar-flet `src/App.tsx` 98行（`{ key: 'scale', label: 'スケール' }`）、934行〜（スケールビュー）、1034行（`<ScaleQuiz`） | 2026-11-17 | タブ定義とスケールビューの実装 |

- 本人の体験・評価は書かない（`[NEED` は0件で出す）
- 曲名・ギタリスト名・「ジャズでよく使う」などの用途の主張は書かない（出典表に無いため）

## 形式

- CONTENT-GUIDE の「形式」に従う。純粋な静的ページで `/src/` を読み込まない。h1 は1つ。CSS はページ内の `<style>` で、`guides/memorize-fretboard/index.html` と `chords/c/index.html` のトークンを写す
- head: title・description・自己参照の canonical・og 一式・favicon・JSON-LD（Article と BreadcrumbList）
- **日英の対**（CONTENT-GUIDE の「日本語だけ」の例外。`en/ear-training/index.html` の head が見本）:
  - 両言語で `hreflang="ja"`・`hreflang="en"`・`hreflang="x-default"`（英語版を指す）の3本
  - 日本語版は `<html lang="ja">`、英語版は `<html lang="en">`。英語版の本文・title・description・aria-label に日本語の文字（ひらがな・カタカナ・漢字）を含めない
  - 言語の切り替えリンクを本文の上部に置く（見本: `en/ear-training/index.html` の 56 行）
- 図は inline SVG、文字は14px以上、`aria-label` に図の内容を文で書く

## やること（実装）

1. `scripts/scale-pages/scales.mjs`（新規）: 2スケールのデータ（スラッグ・ルート・音程・度数記号・ポジションの定義・日英の本文・FAQ）
2. `scripts/generate-scale-pages.mjs`（新規）: データから4つの `index.html` を書き出す。`SCALE_SLUGS` を export する。音は開放弦＋フレットで計算し、各ポジションで7度数がそろわない・スケール外の音が入る・r5/r6 が範囲外のときは生成を止める。`chords` の生成スクリプトは import せず、必要な関数は自前で持つ（P1-8 の生成物を変えないため）
3. `scales/c-major/index.html`・`scales/dorian/index.html`・`en/scales/c-major/index.html`・`en/scales/dorian/index.html`（新規・生成物）
4. `vite.config.ts`: `rolldownOptions.input` に4件
5. `scripts/generate-sitemap.mjs`: `bilingual` に `scales/c-major/`・`scales/dorian/` を足す（ja・en・x-default=en の形）
6. `src/scalePages.test.ts`（新規）: 上の手で数えた6ポジションの期待値と、開放弦からの独立した計算（生成スクリプトのコードを使わない）で照合する。他のキーへ移す表の12キー×2弦を照合する。生成物がスクリプトの出力と一致すること、各ページの h1 が1つ・自己参照 canonical・hreflang 3本・`lang` 属性、英語版に日本語の文字が無いこと、同じ言語のもう1つのスケールへのリンクがあることを見る。`dist/fretboard/` があるときはビルド後の4ページも見る（`src/chordPages.test.ts` の `describe.runIf` の型）
7. `src/i18n/metadata.test.ts`・`src/i18n/earTrainingMetadata.test.ts`: サイトマップの件数を9→13件に。日英の対として扱う判定に `/scales/` を足す（必要な場合）
8. `guides/memorize-fretboard/index.html`: 「次に開くページ」に2本（C メジャー・ドリアンの日本語版）へのリンクを1行足す
9. `docs/CONTENT-GUIDE.md`: 「型と置き場所」と「形式」に、日英の対で作る量産ページの型（置き場所・hreflang・sitemap の `bilingual`・英語版に日本語を含めない）を追記する

## やらないこと

- 試作の判定前に、他のキー・スケールへ量産しない
- `chords/*`・`scripts/generate-chord-pages.mjs`・`scripts/chord-pages/*`・`src/chordPages.test.ts` は変えない（P1-8 が 2026-12-22 に再判定を待っており、生成物一致のテストもあるため）
- `src/` のアプリのコード・`src/i18n/ui.ts` は変えない。アプリに URL でスケールを指定する口は足さない
- ハブ（guitartoolbox）・`/theory/`（guitar-theory）のファイルは変えない
- push・本番公開・GSC へのインデックス依頼は、この実装ではしない（運営者の確認後）

## 変更してよいファイル

- `scripts/scale-pages/scales.mjs`（新規）
- `scripts/generate-scale-pages.mjs`（新規）
- `scales/c-major/index.html`・`scales/dorian/index.html`・`en/scales/c-major/index.html`・`en/scales/dorian/index.html`（新規・生成物）
- `src/scalePages.test.ts`（新規）
- `vite.config.ts`（input の4行のみ）
- `scripts/generate-sitemap.mjs`
- `src/i18n/metadata.test.ts`・`src/i18n/earTrainingMetadata.test.ts`（件数と日英の対の判定のみ）
- `guides/memorize-fretboard/index.html`（「次に開くページ」の1行のみ）
- `docs/CONTENT-GUIDE.md`（日英の対の型の追記のみ）
- この仕様書

## 受け入れ条件

- `npm run build` → `npx vitest run`（直列・長い制限時間で可）→ `npm run lint`（エラー0）が通る
- `dist/fretboard/scales/{c-major,dorian}/index.html` と `dist/fretboard/en/scales/{c-major,dorian}/index.html` が、h1 1つ・自己参照 canonical・hreflang 3本（ja・en・x-default=en）で出る
- `dist/fretboard/sitemap.xml` が13件で、4本が hreflang つきで載る。`chords/*` の4本は hreflang なしのまま
- `dist/fretboard/chords/c/index.html` がこの変更の前後で同じ（P1-8 に影響しない）
- 英語版2本の HTML に日本語の文字が無い。ビルド後の英語版の head で manifest が `/fretboard/en/manifest.webmanifest` になっていても、canonical・hreflang が壊れていない
- 375px と 1280px で横はみ出しが0
- 本文に `[NEED` が無い。本文の文の事実はすべて「事実と出典」表にある
- 内部リンク: 同じ言語のもう1つのスケール、ツールの入口、日本語版は `/theory/modes/`・`/theory/major-minor-scale/`、`guides/memorize-fretboard/` から日本語版2本へ

## 効果の測り方と撤退条件

- 測るもの: 狙う3語（「Cメジャースケール ギター」「c major scale guitar」「dorian mode guitar」）で、それぞれの受け皿のページが取る Google の掲載順位。あわせて4URLの GSC の表示回数・平均掲載順位（28日、page 次元）
- 変更前の値の出どころ: ページが無いため0。前後比較にしない
- 狙う語の順位の読み方（P1-8 の判定で、表示の少ないクエリが GSC で匿名化され page×query が空になったため、公開前に決めておく）:
  1. GSC の page×query に狙う語（表記ゆれを含む）が出ていれば、その平均順位を使う
  2. 出ていなければ、ラッコの順位の取得（`search-rank-history` など、司令塔が直接・数クレジット）で3語の実順位を取る。英語の語で US の順位が取れない場合はその語を「読めない」とする
  3. それでも読めない語は、需要に対する表示回数で推定する（月間検索数に対して28日の表示が1桁なら20位以内に入っていないとみなす）
- 判定（判定日 = 公開3週後）: 狙う3語のうち2語以上で10位以内なら、次の site-backlog で量産の TODO に上げる（ハブ P2-4 の基準）
- 判定不能の条件: 未登録（URL 検査で未登録）のページは数えない。登録済みが2本未満、または4URLの表示の合計が30未満なら判定不能とし、最長で公開16週後まで延ばす（site-backlog の共通規則）
- 撤退条件: 登録済みで3語とも20位より下なら量産しない。中身（図と表の厚み）を見直すか、軸を変えるかを ADR で決める

## 実装メモ

- 2026-11-17 仕様化（Claude、site-content の手順）。上位ページの確認: ラッコ headline 2語（計6クレジット、残高 6,580）と web-researcher（英語2語）
- 2026-11-17 実装: 生成スクリプト・データ・テストは codex-worker、生成物は `node scripts/generate-scale-pages.mjs` で作成。Claude が直した点: FAQ「Dm7 の上ではドリアン」を出典どおり「D ドリアン」に（日英）、練習の案内をアプリの表示名「スケール内/外」「度数当て」（英語 In/out of scale・Identify the degree）に、指板図で6弦の音名とフレット番号の間が1pxだったためフレット番号を y=416→432・SVG の高さを 432→448 に
- 検証: build・vitest 206件（直列）・lint エラー0（警告10、既存のみ）。375px・1280px で4ページとも横はみ出し0。英語版2本に日本語の文字0。sitemap 13件、scales 4本は hreflang 3本、chords 4本は hreflang なし。`dist/fretboard/chords/c/index.html` は本番との差が計測タグ2本（ビルド時の測定 ID と Cloudflare のビーコン）だけ。verifier の独立検収は8項目すべて PASS（全 SVG の data-tone を開放弦から数え直して差0、12キーの移す表も一致）
