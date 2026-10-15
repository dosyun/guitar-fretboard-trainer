/**
 * 指板SVG共通パレット (docs/design-system/README.md)。
 * 指板は実物の木の色を残し、マーカーの色は UI トークン (src/index.css :root) と同じ値にそろえる。
 * SVG の属性に置くため CSS 変数ではなく実値で持つ。
 *
 * 素材メタファ:
 *  - board   : エボニー/ローズウッドの指板 (暖色の濃茶)
 *  - fretwire: ニッケルシルバーのフレット
 *  - string  : ニッケル弦
 *  - nut     : 牛骨ナット
 *  - inlay   : 白蝶貝のポジションインレイ
 *
 * 全ての指板系SVG (Fretboard / FretboardMap / ScaleMap / CagedMap /
 * VoicingDiagram / ArpeggioPage) はこの定数を参照し、色を一元管理する。
 */
export const BOARD = {
  board: '#241d14',      // 指板 (エボニー)
  boardEdge: '#16110a',  // 指板の縁/影
  nut: '#cdbf9e',        // 牛骨ナット
  fretwire: '#5f636b',   // ニッケルのフレット
  string: '#8b8f98',     // ニッケル弦
  inlay: '#b8ad93',      // 白蝶貝のポジションマーク (3,5,7,9,12)
  fretNumber: '#979aa0', // フレット番号 (= --dim)
  stringLabel: '#979aa0',// 弦名ラベル (= --dim)
} as const;

/** フレットマーカー(円)の状態色。highlight=琥珀のジュエル、correct/wrong=状態色。 */
export const MARKER = {
  // 出題ハイライト (アクセント=琥珀)。操作の合図は実塗りで(グロウは使わない)。
  highlightBg: '#ffb02e',     // = --accent
  highlightBorder: '#d08a17',
  highlightText: '#121315',   // = --bg
  // 正誤フィードバック
  correctBg: '#5fd394',       // = --correct
  correctBorder: '#3fae74',
  correctText: '#121315',
  wrongBg: '#ef6a4f',         // = --wrong
  wrongBorder: '#c44f38',
  wrongText: '#121315',       // 白文字だと 3:1 を下回るため暗い文字
  // 正解表示(ラベルのみ、ニュートラル)
  labelBg: '#2a2d31',         // = --panel
  labelBorder: '#3d4147',     // = --case-edge
  labelText: '#ebe7df',       // = --ink
} as const;
