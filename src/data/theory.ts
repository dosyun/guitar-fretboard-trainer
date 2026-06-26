/**
 * その場の「なぜ?」(Layer1) — 度数/コードトーンの種明かしを1行で。
 * 練習の回答時に表示し、暗記をその場で理解に変える。
 */
const ROLE: Record<string, string> = {
  R: 'ルート＝土台',
  '3': '長3度＝明るい',
  M3: '長3度＝明るい',
  '♭3': '短3度＝暗い',
  m3: '短3度＝暗い',
  '5': '完全5度＝安定の柱',
  P5: '完全5度＝安定の柱',
  '♭5': '減5度＝緊張',
  '#4/b5': 'トライトーン＝不安定',
  '♭7': '短7度＝進行感を生む',
  m7: '短7度＝進行感を生む',
  '7': '長7度＝maj7の浮遊感',
  M7: '長7度＝maj7の浮遊感',
  m2: '短2度',
  M2: '長2度',
  P4: '完全4度',
  m6: '短6度',
  M6: '長6度',
};

/** 例: 「♭3 = D から半音3つ → F（短3度＝暗い）」 */
export function toneWhy(deg: string, semitones: number, root: string, note: string): string {
  const role = ROLE[deg];
  return `${deg} = ${root} から半音${semitones}つ → ${note}${role ? `（${role}）` : ''}`;
}
