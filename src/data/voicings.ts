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

export const VOICING_TYPE_LIST: ChordVoicingType[] = ['major', '7', 'M7', 'm', 'm7', 'm7b5'];
