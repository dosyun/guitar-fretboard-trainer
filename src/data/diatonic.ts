import type { ChordVoicingType } from './voicings';

export interface DiatonicDegree {
  roman: string;
  type: ChordVoicingType;
  semitones: number;
}

export const MAJOR_DIATONIC: DiatonicDegree[] = [
  { roman: 'I',    type: 'M7',   semitones: 0 },
  { roman: 'IIm',  type: 'm7',   semitones: 2 },
  { roman: 'IIIm', type: 'm7',   semitones: 4 },
  { roman: 'IV',   type: 'M7',   semitones: 5 },
  { roman: 'V',    type: '7',    semitones: 7 },
  { roman: 'VIm',  type: 'm7',   semitones: 9 },
  { roman: 'VIIm', type: 'm7b5', semitones: 11 },
];

export const MINOR_DIATONIC: DiatonicDegree[] = [
  { roman: 'Im',   type: 'm7',   semitones: 0 },
  { roman: 'IIm',  type: 'm7b5', semitones: 2 },
  { roman: 'III',  type: 'M7',   semitones: 3 },
  { roman: 'IVm',  type: 'm7',   semitones: 5 },
  { roman: 'Vm',   type: 'm7',   semitones: 7 },
  { roman: 'VI',   type: 'M7',   semitones: 8 },
  { roman: 'VII',  type: '7',    semitones: 10 },
];

const CHORD_SUFFIX: Record<ChordVoicingType, string> = {
  major: '',
  M7:    'maj7',
  '7':   '7',
  m:     'm',
  m7:    'm7',
  m7b5:  'm7(♭5)',
};

const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function getChordName(keyIndex: number, degree: DiatonicDegree): string {
  const rootName = NOTE_NAMES_FLAT[(keyIndex + degree.semitones) % 12];
  return rootName + CHORD_SUFFIX[degree.type];
}

export function getDegreeRoot(keyIndex: number, semitones: number): string {
  return NOTE_NAMES_FLAT[(keyIndex + semitones) % 12];
}

export interface ChordProgression {
  name: string;
  description: string;
  scale: 'major' | 'minor';
  degrees: number[]; // MAJOR_DIATONIC or MINOR_DIATONIC のインデックス
}

export const JAZZ_PROGRESSIONS: ChordProgression[] = [
  {
    name: 'ii-V-I',
    description: 'ジャズの最基本進行',
    scale: 'major',
    degrees: [1, 4, 0],
  },
  {
    name: 'ii-V-i (minor)',
    description: 'マイナーキーの基本進行',
    scale: 'minor',
    degrees: [1, 4, 0],
  },
  {
    name: 'I - VI - II - V',
    description: 'ターンアラウンド（循環コード）',
    scale: 'major',
    degrees: [0, 5, 1, 4],
  },
  {
    name: 'IIIm - VI - IIm - V',
    description: '逆循環コード',
    scale: 'major',
    degrees: [2, 5, 1, 4],
  },
  {
    name: 'I - IVmaj7 - IIIm - VIm',
    description: '下降進行',
    scale: 'major',
    degrees: [0, 3, 2, 5],
  },
  {
    name: 'Im - VII - VI - V',
    description: 'マイナー下降進行',
    scale: 'minor',
    degrees: [0, 6, 5, 4],
  },
];
