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

export function chordById(id: string): ChordTypeDef {
  return CHORD_TYPES.find((c) => c.id === id) ?? CHORD_TYPES[0];
}

/** コード進行（キー内の度数で定義し、選んだキーへ転調）。degree=キールートからの半音。 */
export interface ProgChordDef {
  degree: number;
  type: string;
  roman: string;
}
export interface ProgressionDef {
  id: string;
  label: string;
  chords: ProgChordDef[];
}

export const PROGRESSIONS: ProgressionDef[] = [
  {
    id: 'ii-v-i',
    label: 'ii-V-I',
    chords: [
      { degree: 2, type: 'm7', roman: 'ii' },
      { degree: 7, type: '7', roman: 'V' },
      { degree: 0, type: 'maj7', roman: 'I' },
    ],
  },
  {
    id: 'I-vi-ii-V',
    label: 'I-vi-ii-V',
    chords: [
      { degree: 0, type: 'maj7', roman: 'I' },
      { degree: 9, type: 'm7', roman: 'vi' },
      { degree: 2, type: 'm7', roman: 'ii' },
      { degree: 7, type: '7', roman: 'V' },
    ],
  },
  {
    id: 'i-iv-v',
    label: 'i-iv-V (minor)',
    chords: [
      { degree: 0, type: 'min', roman: 'i' },
      { degree: 5, type: 'min', roman: 'iv' },
      { degree: 7, type: '7', roman: 'V' },
    ],
  },
  {
    id: 'blues',
    label: 'ブルース I-IV-I-V',
    chords: [
      { degree: 0, type: '7', roman: 'I7' },
      { degree: 5, type: '7', roman: 'IV7' },
      { degree: 0, type: '7', roman: 'I7' },
      { degree: 7, type: '7', roman: 'V7' },
    ],
  },
];
