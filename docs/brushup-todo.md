# ブラッシュアップ TODO

2026-07-02 のコードベース全体調査（コード健全性／UX・機能完成度／品質・a11y・PWA／UI/UX批評の4観点）で洗い出した改善バックログ。
総評: **教育設計・練習エンジンの思想は良いが、(1) 計測データの正確性に実バグがあり、(2) 学習ループが音名認識でしか閉じておらず、(3) 機能を足しすぎて情報アーキテクチャが飽和している**。機能追加より「統合・削除・正確化」のフェーズ。

優先度: P0=バグ（今すぐ） / P1=中核価値に直結 / P2=構成の再設計・品質 / P3=基盤・将来

---

## P0 — バグ・データの正しさ（計測アプリとしての信頼性）

- [ ] **表記「両方」で位置→音名クイズが正解不能（確認済みバグ）**
  判定は `getNoteAt(...,'both')`＝シャープ表記（`fretboard.ts:68-70`）、回答ボタンは `getNoteNames('both')`＝フラット表記（`fretboard.ts:174-175`）で、派生音5音は `selectedNote === correct`（`useQuiz.ts:157`）が常に不一致。
  → 対処: 判定を音程インデックス（0-11）比較にするか、`'both'` 自体を廃止して表記2択に（P2の削減候補も参照）。
- [ ] **度数統計のクロスコンタミ**: コードトーン/進行/ガイド音/キー機能/耳トレの5モードが全て `quizType:'interval'` で記録するため、`gft-degreestats-v1`（`practiceStore.ts:80-90`）に指板を触らない多肢選択（耳トレ・キー機能）の結果まで合算される。「度数の弱点」「度数◯を探す問題が弱い」（`StatsPage.tsx:154-177` / `mistakeClinic.ts:114`）の表示が実態と乖離し、`pickWeightedIntervalPosition`（`practiceStore.ts:283-312`）経由で**耳トレの誤答が指板の度数出題の重み付けに波及**。
  → 対処: `quizType` を `'chordtone' | 'progression' | 'guidetone' | 'keyfunc' | 'ear'` 等に分離。
- [ ] **「前回比」のモード間汚染**: 各クイズの `stop()` が `getLastSession('interval')` で前回を取るため、コードトーン直後に耳トレを終えると耳トレの前回比がコードトーンとの比較になる（`ChordToneQuiz.tsx:60` ほか5ファイル、`useSession.ts:59-60`）。quizType分離で同時解消。
- [ ] **連続日数(streak)が基本モード専用**: `recordPracticeDay()` の呼び出しは `App.tsx:365`（handleEnd）のみ。毎日コードトーンや耳トレだけ練習しても「連続N日」が途切れる。全モードの終了時に記録する。
- [ ] **Home と Stats の「累計問題数」の定義不一致**: Home＝終了済みセッション合計（`HomePage.tsx:40`）、Stats＝生ログ全件・2000件で頭切り（`StatsPage.tsx:44`）。同一ラベルで数字がズレる。定義を1つに。
- [ ] **「総合正答率」と「平均反応」の母集団不一致**: 正答率は全モード混在、平均反応は音名認識セルのみ（`HomePage.tsx:41-46` / `StatsPage.tsx:44-50`）。指標間の因果が読めない。母集団を揃えるか注記する。
- [ ] **コピペ由来の記録不整合**: `ChordProgressionQuiz.tsx:96-103` だけ `session.record` に `rootNote` を渡していない。`ChordToneQuiz.tsx:91` の `wrongPick.deg` だけ現在stateの `root` 基準（他は `target.root` 基準）。
- [ ] **useScore×3 が同一ベストストリークキーを共有**: basic/caged/scale の3インスタンス（`App.tsx:121,166,181`）が全て `guitar-fret-best-streak`（`useScore.ts:4`）を読み書きし、混ざる。キーを分けるか統合。
- [ ] **`selectedBox` が死んだ式**: `App.tsx:187` の `selectedBox !== null ? undefined : undefined // TODO: box range`。スケールのポジション選択がクイズに反映されない。実装するか選択UIごと外す。

## P1 — 学習ループを全モードで閉じる

「練習→結果→弱点→その場で潰す」ループが閉じているのは音名認識だけ。

- [ ] **弱点ドリルの音名固定を解除**: `handleStartDrill`（`App.tsx:333`）は `note-to-position` 固定。度数・コードトーン等の弱点にも対応するドリル起動を追加し、インターバル系 ResultScreen の `showDrill={false}` を解除。
- [ ] **MistakeClinic のデッドエンド解消**: `string`/`fret`/`degree` 診断（`mistakeClinic.ts:96-114`）に練習ボタンがない（drill付きは note/confusion のみ）。「2弦が弱い」→ 2弦絞り込みドリル、のように診断全種から練習に飛べるように。
- [ ] **TriadBuilder のエンジン統合**: 現状 `recordSkill('triad')` のみで useSession/ResultScreen/前回比なし（`TriadBuilder.tsx:89`）。目標「コードの仕組みを理解したい」（`goal.ts:50`）の主線がこの半連動状態。
- [ ] **ガイド音を独立スキルに**: `GuideToneTrainer.tsx:127` が `recordSkill('progression')` を使うため SkillMap で進行と混ざる。`SkillId` に `'guidetone'` を追加（`skillStore.ts:8`）。
- [ ] **レッスン→練習の着地を増やす**: 練習モードに着地するのは21レッスン中3本のみ（`lessons.ts` の `practice-chord`/`practice-prog`）。少なくとも triad→TriadBuilder、function→KeyFunctionQuiz を接続。`tritone-sub`（`lessons.ts:286-299`）は link 自体がなく尻切れ。耳トレ/ガイド音への導線もゼロ。
- [ ] **「今日の練習」の目標連動**: `handleStartDaily`（`App.tsx:349-357`）は目標に関係なく常に position-to-note。アドリブ/作曲目標なら度数やコードトーンを混ぜる。目標skip時（`goal.ts:80-83`）は Home に何も推奨が出ない問題も対処。
- [ ] **レッスンの間隔反復（検討）**: `lessonProgress.ts` は完了フラグのみ。理解度チェックの回答も保存されず（`LessonsPage.tsx:29-67`）、復習の仕組みがない。

## P1 — データ保護・永続化の持続性

- [ ] **エクスポート/インポート（JSON）**: バックアップ手段が皆無なのに「練習履歴を削除」ボタンだけある（`App.tsx:950-957`）。機種変更・ブラウザデータ削除で全消失。設定に「データを書き出す/読み込む」を追加（実装コスト小・保険効果大）。
- [ ] **`gft-sessions-v1` の無制限増大**: `saveSession`（`practiceStore.ts:175-179`）は push のみでトリミングなし。attempts 同様に上限を設ける。
- [ ] **毎問 O(n) 書き込みの改善**: `recordAttempt`（`practiceStore.ts:58-64`）が1問ごとに最大2000件を load→push→全量 stringify。差分書き込みか IndexedDB 移行を検討。
- [ ] **スキーマ検証とマイグレーション基盤**: `-v1` キーは名ばかりで、`JSON.parse(...) as T` の無検証キャスト（`practiceStore.ts:35` ほか全store）。形状検証＋バージョン移行関数を用意しないと、スキーマ変更時に旧データが孤児化 or 実行時エラー。

## P2 — UI/UX 再設計（統合と削除）

方針: **1画面1メッセージ。Home=次の一手、Stats=詳細分析、と役割を割り切る。**

### 構成の見直し

- [ ] **Home と Stats の重複解消**: 3統計グリッド（累計/正答率/平均反応）が両画面に同一表示（`HomePage.tsx:146-150` / `StatsPage.tsx:84-88`）、MasteryBar も両画面（`HomePage.tsx:145` / `StatsPage.tsx:91`）。Home は streak＋目標CTA/今日の練習＋PhaseMap の3要素に絞り、数値サマリと MasteryBar は Stats へ集約。
- [ ] **Stats の「苦手」3重表現を一本化**: 苦手ポジションTOP5（`StatsPage.tsx:127-151`）／ヒートマップ:誤答（`:103`）／MistakeClinic（`:97`）は同じ弱点情報の別形式。言語化＋ドリル付きの MistakeClinic＋ヒートマップに寄せ、TOP5リストは削除候補。
- [ ] **weakness() の4重コピペ統一**: `FAST_MS/SLOW_MS`＋weakness計算が `HomePage.tsx:30-34` / `StatsPage.tsx:27-33` / `ResultScreen.tsx:21-25` / `mastery.ts:12-23` に重複。ズレると画面間で「一番の弱点」が食い違う。mastery.ts に一本化。
- [ ] **理論タブ 8ピル→4ピル**: voicing/open/diatonic は同じ `VoicingDiagram` ベースの「コード」テーマ（`VoicingPage.tsx:71-87` / `OpenChordPage.tsx:63-73` / `DiatonicPage.tsx:96,147`）→1タブに統合。scale/caged/arpeggio も「指板を音で塗る」系として統合可能。「学ぶ / 指板マップ / スケール系 / コード系」の4ピルへ。横スクロール見切れ（`App.tsx:83` のコメントが自認）も解消。
- [ ] **練習タブの7モードトグルを絞る**: 初見の認知負荷が高い。直接トグルは「基本/トライアド/耳トレ」程度にし、コードトーン/進行/ガイド音/キー機能は目標カード・レッスン導線（`handleStartGoal`/`handleLessonGoto`）経由に寄せる。
- [ ] **ボトムナビ導入**: 主ナビが上部タブ（`App.tsx:415-429`）で片手持ちの親指が届かない。モバイル前提なら5タブはボトムタブバーが定石。
- [ ] **「今日の練習」vs「チャレンジ」の違いを明示**: 実装差は弱点優先か純ランダムか（`useQuiz.ts:39-43`）だが文言に出ていない。「今日の練習=弱点を狙い撃ち」「チャレンジ=全体から腕試し」の副題を1行添える。

### クイズ中の画面

- [ ] **セッション開始後は設定を畳む**: 練習範囲は開始後アコーディオンに畳むのに（`App.tsx:715-723`）、7モード群・ModeSelector・RootSelector は回答中も常時表示。同じ扱いで畳む。開始前も PracticeRangeSelector（コントロール40個超）は畳みをデフォルトに。
- [ ] **カウンタの一本化**: ScoreBoard（4指標）とセッション進捗ピルが併存（`App.tsx:612-621`）。回答中は「正解率＋進捗」だけに。
- [ ] **音名系の誤答にも「なぜ」**: 度数系には getIntervalWhy がある（`App.tsx:277-282`）のに、最も反復回数の多い音名系は正解ラベル表示のみ。既存の getHintText（`App.tsx:199-224`）を誤答時に自動再利用。
- [ ] **正解時に実音を鳴らす**: `getMidiAt`（`fretboard.ts:56`）と audio.ts があるのに正誤と音が連動していない。正解でタップ位置の実音再生→「音と位置の結びつき」強化。
- [ ] **スコア表示の共通コンポーネント化**: 6つの専門クイズがそれぞれ独自の score 表示を再実装しており見え方が不統一。

### 不要・削減候補（削る勇気）

- [ ] **表記 `'both'` の廃止**: P0のバグの温床。#/♭の2択で十分。
- [ ] **チャレンジ `∞` の格下げ/削除**: target=null だと ResultScreen のクリア判定が発火しない（`ResultScreen.tsx:40-41`）。達成感が働かない無限練習。
- [ ] **フレット数5択→2〜3択**: 12/15/17/19/22（`SettingsPanel.tsx:17`）のうち 17/19 は実質死に設定。「12 / 22」か「12/15/22」に。
- [ ] **ScoreBoard の「連続/最高」削除**: streak（日数）・進捗ピル・前回比と達成系が既に多い。回答中の表示から落とす（`ScoreBoard.tsx:26-37`）。
- [ ] **未使用依存とデッドコード削除**: `@ant-design/icons` / `@radix-ui/react-toggle-group` / `class-variance-authority` は import ゼロ。`components/ui/{Tabs,Button}.tsx`＋`utils/cn.ts` はどこからも import されない scaffold 遺物（`@radix-ui/react-tabs`/`clsx`/`tailwind-merge` ごと削除可能）。
- [ ] **useSession の未使用API削除**: `discard`/`active`/`correct` は呼び出しゼロ（`useSession.ts:72-78`）。

## P2 — 品質・アクセシビリティ・パフォーマンス

- [ ] **SVG指板の a11y**: タップ対象が `<g onClick>` のみで role/tabIndex/aria-label なし（`FretMarker.tsx:55-59`）。キーボード・スクリーンリーダーで note-to-position が操作不能。各セルに `role="button" tabIndex={0} aria-label="◯弦◯フレット"`＋`onKeyDown` を。ルート `<svg>` にも `aria-label`（`Fretboard.tsx:76-81` / `FretboardMap.tsx` / `VoicingDiagram.tsx`）。
- [ ] **aria-live の導入**: `aria-live`/`role="status"` の使用がアプリ全体でゼロ。正誤フィードバック・自動出題切替が支援技術に通知されない。
- [ ] **タッチターゲット44px**: 指板セルの実効ヒット径は約30px（`FretMarker.tsx:69-77`、viewBoxスケール約0.83）。WCAG 2.5.5 の44px未満で隣接弦の誤タップも起きやすい。
- [ ] **正誤を色以外でも伝える**: 緑/赤の塗りのみ（`boardPalette.ts:26-42` / `NoteSelector.tsx:24-33`）。✓/✗ の記号併記を。
- [ ] **ErrorBoundary 追加**: 実装ゼロ（`main.tsx`）。レンダーエラーで白画面化し、PWAオフライン時に復帰手段なし。
- [ ] **バンドル分割**: 658KB 単一チャンク・`React.lazy` ゼロ。antd の実用途は Tabs/Segmented/Switch/ConfigProvider の4種のみ → Segmented を自前トグルに置換して antd 依存を縮小、理論系ページを lazy 分割。
- [ ] **OGP/Twitter Card 追加**: `index.html` に og:* が皆無。共有時にプレビューが出ない。
- [ ] **audio.ts の磨き込み**: マスターゲイン導入（同時発音のクリッピング対策・音量調整の土台）、`onended` での `disconnect()`、`resume()` 失敗時のハンドリング（`audio.ts:44,59-69`）。
- [ ] **`scrollTo({behavior:'smooth'})` の reduced-motion 対応**（`Fretboard.tsx:65`）。

## P3 — ギターアプリとして期待される機能（選んで足す）

全部やる必要はない。「究極の練習アプリ」方針なら期待値の高い順に:

- [ ] 左利き表示（指板反転）
- [ ] 音量スライダー（現状 ON/OFF のみ、`audio.ts:20-35`）
- [ ] 練習時間合計・日別履歴カレンダー（草）— SessionSummary は startedAt/endedAt を持つのに未集計（`useSession.ts:64-65`）
- [ ] 練習リマインダー通知（streak を持つのに促す手段がない）
- [ ] チューニング変更（EADGBE ハードコード: `fretboard.ts:3` / `scales.ts:94,123,187`）・カポ
- [ ] メトロノーム/BPM

## P3 — 開発基盤・保守性

- [ ] **6クイズの共通化**: ChordTone/Progression/GuideTone/KeyFunc/EarTraining/Triad（計約1,400行）は state一式・start/stop・採点・ResultScreen分岐・フッターJSXがほぼ逐語一致のコピペ。`useTapQuiz`/`useChoiceQuiz` フック＋`<QuizShell>` に抽出（P0の quizType 分離と同時にやると二度手間にならない）。
- [ ] **テスト導入（vitest）**: テスト完全ゼロ。`statWeakness`/`rollBuckets`/`median`（practiceStore）、`cellMastery`（mastery）、`computePhaseStatus`（phases）など純関数が多くテスト費用対効果が高い。P0のバグ修正時に回帰テストとして書き始めるのが効率的。
- [ ] **App.tsx の分割**: 975行・useState 29個。basic練習ブロック（`App.tsx:597-728`）だけでもコンポーネント化。
- [ ] **ESLint を type-checked 構成に**: `no-floating-promises` 等が効いていない（`void ctx.resume()` を検出できない）。
- [ ] **メモ化**: 子コンポーネントの `React.memo` ゼロ。Fretboard/FretboardMap/FretMarker のメモ化＋静的レイヤー分離。StatsPage の `getAllAttempts()` 毎レンダー全parse（`StatsPage.tsx:38-41`＋`mistakeClinic.ts:46` で二重）に `useMemo`。
- [ ] **CLAUDE.md の乖離修正**: 「全19レッスン」→実際は21（同じ行の「N/21完了」と自己矛盾）。「各レッスン=盤面実演」→ demo なしが8レッスン（notes/diatonic/ii-v-i/function/secondary-dominant/tritone-sub/reharmonize/modulation）。TriadBuilder の「エンジン未連動」→正確には skillStore のみ連動。
- [ ] **レッスンの充実（余力があれば）**: 確認クイズが全21レッスン一律2問。進行系レッスンにこそ盤面＋発音のdemoを。

---

## 推奨着手順

1. **P0 の quizType 分離＋'both' バグ** — 計測アプリとしての信頼性回復。6クイズ共通化と同時に実施すると効率的
2. **データエクスポート** — 実装コスト小、消失保険として効果大
3. **Home/Stats の役割分離**（P2構成見直しの先頭2項目） — 体感が最も変わる
4. 以降は P1 のループ閉鎖 → P2 の削減・a11y → P3
