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
    frets: [0, 2, 0, 1, 0, 0],
  },
  {
    type: 'M7',
    label: 'M7',
    frets: [0, 2, 1, 1, 0, 0],
  },
  {
    type: 'm',
    label: 'マイナー',
    frets: [0, 2, 2, 0, 0, 0],
  },
  {
    type: 'm7',
    label: 'm7',
    frets: [0, 2, 2, 0, 3, 0],
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
export interface OpenChord {
  name: string;
  label: string;
  root: string; // NoteName
  frets: (number | 'x')[];
}

export const OPEN_CHORDS: OpenChord[] = [
  { name: 'C',  label: 'C',   root: 'C',  frets: ['x', 3, 2, 0, 1, 0] },
  { name: 'D',  label: 'D',   root: 'D',  frets: ['x', 'x', 0, 2, 3, 2] },
  { name: 'E',  label: 'E',   root: 'E',  frets: [0, 2, 2, 1, 0, 0] },
  { name: 'G',  label: 'G',   root: 'G',  frets: [3, 2, 0, 0, 0, 3] },
  { name: 'A',  label: 'A',   root: 'A',  frets: ['x', 0, 2, 2, 2, 0] },
  { name: 'Am', label: 'Am',  root: 'A',  frets: ['x', 0, 2, 2, 1, 0] },
  { name: 'Em', label: 'Em',  root: 'E',  frets: [0, 2, 2, 0, 0, 0] },
  { name: 'Dm', label: 'Dm',  root: 'D',  frets: ['x', 'x', 0, 2, 3, 1] },
  { name: 'E7', label: 'E7',  root: 'E',  frets: [0, 2, 0, 1, 0, 0] },
  { name: 'A7', label: 'A7',  root: 'A',  frets: ['x', 0, 2, 0, 2, 0] },
  { name: 'D7', label: 'D7',  root: 'D',  frets: ['x', 'x', 0, 2, 1, 2] },
  { name: 'G7', label: 'G7',  root: 'G',  frets: [3, 2, 0, 0, 0, 1] },
  { name: 'C7', label: 'C7',  root: 'C',  frets: ['x', 3, 2, 3, 1, 0] },
  { name: 'B7', label: 'B7',  root: 'B',  frets: ['x', 2, 1, 2, 0, 2] },
];
