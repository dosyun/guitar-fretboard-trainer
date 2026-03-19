// コードボイシングデータ
// fretsは6弦→1弦の順で、ルートフレットからの相対フレット数
// 'x' = ミュート

export type ChordVoicingType = 'major' | '7' | 'M7' | 'm' | 'm7' | 'm7b5';

export interface ChordVoicing {
  type: ChordVoicingType;
  label: string;
  frets: (number | 'x')[]; // [6弦, 5弦, 4弦, 3弦, 2弦, 1弦]
}

// 6弦ルート（Eフォーム系バレーコード）
export const VOICINGS_6TH: ChordVoicing[] = [
  {
    type: 'major',
    label: 'メジャー',
    frets: [0, 2, 2, 1, 0, 0],
  },
  {
    type: '7',
    label: '7th',
    frets: [0, 'x', 0, 1, 0, 'x'],
  },
  {
    type: 'M7',
    label: 'M7',
    frets: [0, 'x', 1, 1, 0, 'x'],
  },
  {
    type: 'm',
    label: 'マイナー',
    frets: [0, 2, 2, 0, 0, 0],
  },
  {
    type: 'm7',
    label: 'm7',
    frets: [0, 'x', 0, 0, 0, 'x'],
  },
  {
    type: 'm7b5',
    label: 'm7(♭5)',
    frets: [0, 1, 2, 0, 2, 'x'],
  },
];

// 5弦ルート（Aフォーム系バレーコード）
export const VOICINGS_5TH: ChordVoicing[] = [
  {
    type: 'major',
    label: 'メジャー',
    frets: ['x', 0, 2, 2, 2, 0],
  },
  {
    type: '7',
    label: '7th',
    frets: ['x', 0, 2, 0, 2, 0],
  },
  {
    type: 'M7',
    label: 'M7',
    frets: ['x', 0, 2, 1, 2, 0],
  },
  {
    type: 'm',
    label: 'マイナー',
    frets: ['x', 0, 2, 2, 1, 0],
  },
  {
    type: 'm7',
    label: 'm7',
    frets: ['x', 0, 2, 0, 1, 0],
  },
  {
    type: 'm7b5',
    label: 'm7(♭5)',
    frets: ['x', 0, 1, 2, 1, 0],
  },
];

// 4弦ルート（Dフォーム系バレーコード）
export const VOICINGS_4TH: ChordVoicing[] = [
  {
    type: 'major',
    label: 'メジャー',
    frets: ['x', 'x', 0, 2, 3, 2],
  },
  {
    type: '7',
    label: '7th',
    frets: ['x', 'x', 0, 2, 1, 2],
  },
  {
    type: 'M7',
    label: 'M7',
    frets: ['x', 'x', 0, 2, 2, 2],
  },
  {
    type: 'm',
    label: 'マイナー',
    frets: ['x', 'x', 0, 2, 3, 1],
  },
  {
    type: 'm7',
    label: 'm7',
    frets: ['x', 'x', 0, 2, 1, 1],
  },
  {
    type: 'm7b5',
    label: 'm7(♭5)',
    frets: ['x', 'x', 0, 1, 1, 1],
  },
];

export const VOICING_TYPE_LIST: ChordVoicingType[] = ['major', '7', 'M7', 'm', 'm7', 'm7b5'];

// オープンコード（絶対フレット番号）
export type OpenChordCategory = 'major' | 'minor' | '7' | 'M7' | 'm7' | 'sus' | 'add9';

export interface OpenChord {
  name: string;
  label: string;
  root: string; // NoteName
  category: OpenChordCategory;
  frets: (number | 'x')[];
}

export const OPEN_CHORD_CATEGORY_LABELS: Record<OpenChordCategory, string> = {
  major: 'メジャー',
  minor: 'マイナー',
  '7': '7th',
  M7: 'maj7',
  m7: 'm7',
  sus: 'sus',
  add9: 'add9',
};

export const OPEN_CHORDS: OpenChord[] = [
  // メジャー
  { name: 'C',  label: 'C',  root: 'C', category: 'major', frets: ['x', 3, 2, 0, 1, 0] },
  { name: 'D',  label: 'D',  root: 'D', category: 'major', frets: ['x', 'x', 0, 2, 3, 2] },
  { name: 'E',  label: 'E',  root: 'E', category: 'major', frets: [0, 2, 2, 1, 0, 0] },
  { name: 'G',  label: 'G',  root: 'G', category: 'major', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'A',  label: 'A',  root: 'A', category: 'major', frets: ['x', 0, 2, 2, 2, 0] },
  // マイナー
  { name: 'Am', label: 'Am', root: 'A', category: 'minor', frets: ['x', 0, 2, 2, 1, 0] },
  { name: 'Em', label: 'Em', root: 'E', category: 'minor', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'Dm', label: 'Dm', root: 'D', category: 'minor', frets: ['x', 'x', 0, 2, 3, 1] },
  // ドミナント7th
  { name: 'E7', label: 'E7', root: 'E', category: '7', frets: [0, 2, 0, 1, 0, 0] },
  { name: 'A7', label: 'A7', root: 'A', category: '7', frets: ['x', 0, 2, 0, 2, 0] },
  { name: 'D7', label: 'D7', root: 'D', category: '7', frets: ['x', 'x', 0, 2, 1, 2] },
  { name: 'G7', label: 'G7', root: 'G', category: '7', frets: [3, 2, 0, 0, 0, 1] },
  { name: 'C7', label: 'C7', root: 'C', category: '7', frets: ['x', 3, 2, 3, 1, 0] },
  { name: 'B7', label: 'B7', root: 'B', category: '7', frets: ['x', 2, 1, 2, 0, 2] },
  // メジャー7th
  { name: 'Cmaj7', label: 'CM7', root: 'C', category: 'M7', frets: ['x', 3, 2, 0, 0, 0] },
  { name: 'Amaj7', label: 'AM7', root: 'A', category: 'M7', frets: ['x', 0, 2, 1, 2, 0] },
  { name: 'Emaj7', label: 'EM7', root: 'E', category: 'M7', frets: [0, 2, 1, 1, 0, 0] },
  { name: 'Dmaj7', label: 'DM7', root: 'D', category: 'M7', frets: ['x', 'x', 0, 2, 2, 2] },
  { name: 'Gmaj7', label: 'GM7', root: 'G', category: 'M7', frets: [3, 2, 0, 0, 0, 2] },
  // マイナー7th
  { name: 'Am7', label: 'Am7', root: 'A', category: 'm7', frets: ['x', 0, 2, 0, 1, 0] },
  { name: 'Em7', label: 'Em7', root: 'E', category: 'm7', frets: [0, 2, 2, 0, 3, 0] },
  { name: 'Dm7', label: 'Dm7', root: 'D', category: 'm7', frets: ['x', 'x', 0, 2, 1, 1] },
  // sus
  { name: 'Dsus4',  label: 'Dsus4', root: 'D', category: 'sus', frets: ['x', 'x', 0, 2, 3, 3] },
  { name: 'Dsus2',  label: 'Dsus2', root: 'D', category: 'sus', frets: ['x', 'x', 0, 2, 3, 0] },
  { name: 'Asus4',  label: 'Asus4', root: 'A', category: 'sus', frets: ['x', 0, 2, 2, 3, 0] },
  { name: 'Asus2',  label: 'Asus2', root: 'A', category: 'sus', frets: ['x', 0, 2, 2, 0, 0] },
  { name: 'Esus4',  label: 'Esus4', root: 'E', category: 'sus', frets: [0, 2, 2, 2, 0, 0] },
  { name: 'Gsus4',  label: 'Gsus4', root: 'G', category: 'sus', frets: [3, 3, 0, 0, 1, 3] },
  { name: 'Csus4',  label: 'Csus4', root: 'C', category: 'sus', frets: ['x', 3, 3, 0, 1, 1] },
  // add9
  { name: 'Cadd9',  label: 'Cadd9', root: 'C',  category: 'add9', frets: ['x', 3, 2, 0, 3, 0] },
  { name: 'Aadd9',  label: 'Aadd9', root: 'A',  category: 'add9', frets: ['x', 0, 2, 4, 2, 0] },
  { name: 'Gadd9',  label: 'Gadd9', root: 'G',  category: 'add9', frets: [3, 2, 0, 2, 0, 3] },
  { name: 'Dadd9',  label: 'Dadd9', root: 'D',  category: 'add9', frets: ['x', 'x', 0, 2, 3, 0] },
  { name: 'Eadd9',  label: 'Eadd9', root: 'E',  category: 'add9', frets: [0, 2, 2, 1, 0, 2] },
  { name: 'Fadd9',  label: 'Fadd9', root: 'F',  category: 'add9', frets: ['x', 'x', 3, 2, 1, 3] },
];
