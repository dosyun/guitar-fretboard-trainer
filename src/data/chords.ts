/**
 * コードトーン練習用のコード定義。
 * tones: ルートからの度数(deg表記)と半音数(st)。
 */
export interface ChordTone {
  deg: string; // 度数表記（R, 3, ♭3, 5, ♭5, ♭7, 7）
  st: number; // ルートからの半音数
}

export interface ChordTypeDef {
  id: string;
  label: string; // コードシンボルの接尾（例: m7）
  tones: ChordTone[];
}

export const CHORD_TYPES: ChordTypeDef[] = [
  { id: 'maj', label: '', tones: [{ deg: 'R', st: 0 }, { deg: '3', st: 4 }, { deg: '5', st: 7 }] },
  { id: 'min', label: 'm', tones: [{ deg: 'R', st: 0 }, { deg: '♭3', st: 3 }, { deg: '5', st: 7 }] },
  { id: '7', label: '7', tones: [{ deg: 'R', st: 0 }, { deg: '3', st: 4 }, { deg: '5', st: 7 }, { deg: '♭7', st: 10 }] },
  { id: 'maj7', label: 'maj7', tones: [{ deg: 'R', st: 0 }, { deg: '3', st: 4 }, { deg: '5', st: 7 }, { deg: '7', st: 11 }] },
  { id: 'm7', label: 'm7', tones: [{ deg: 'R', st: 0 }, { deg: '♭3', st: 3 }, { deg: '5', st: 7 }, { deg: '♭7', st: 10 }] },
  { id: 'm7b5', label: 'm7♭5', tones: [{ deg: 'R', st: 0 }, { deg: '♭3', st: 3 }, { deg: '♭5', st: 6 }, { deg: '♭7', st: 10 }] },
];
