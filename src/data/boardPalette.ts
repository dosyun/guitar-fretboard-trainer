/**
 * ダーク・スタジオ系の指板SVG共通パレット (docs/adr/0003)
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
  fretNumber: '#857c6d', // フレット番号
  stringLabel: '#9c9384',// 弦名ラベル
} as const;

/** フレットマーカー(円)の状態色。highlight=琥珀のジュエル、correct/wrong=状態色。 */
export const MARKER = {
  // 出題ハイライト (アクセント=琥珀)。操作の合図は実塗りで(グロウは使わない)。
  highlightBg: '#f5a623',
  highlightBorder: '#c9821a',
  highlightText: '#1b1813',
  // 正誤フィードバック
  correctBg: '#46c98b',
  correctBorder: '#2fa873',
  correctText: '#0e0f12',
  wrongBg: '#ef5350',
  wrongBorder: '#c43c3a',
  wrongText: '#ffffff',
  // 正解表示(ラベルのみ、ニュートラル)
  labelBg: '#2c2519',
  labelBorder: '#473c28',
  labelText: '#ece5d6',
} as const;
