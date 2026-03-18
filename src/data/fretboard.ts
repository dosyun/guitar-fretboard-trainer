import type { NoteName, NoteNameFlat, IntervalName, FretPosition, Accidental } from '../types';

// 標準チューニング開放弦のMIDIノート番号 (6弦→1弦)
const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // E2, A2, D3, G3, B3, E4

const NOTE_NAMES_SHARP: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const NOTE_NAMES_FLAT: NoteNameFlat[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
];

/** 音名ごとの色 (背景色, テキスト色) */
export const NOTE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'C':  { bg: '#dc2626', text: '#fff', border: '#b91c1c' },   // 赤
  'C#': { bg: '#9f1239', text: '#fff', border: '#881337' },   // ローズ
  'Db': { bg: '#9f1239', text: '#fff', border: '#881337' },
  'D':  { bg: '#ea580c', text: '#fff', border: '#c2410c' },   // オレンジ
  'D#': { bg: '#b45309', text: '#fff', border: '#92400e' },   // アンバー
  'Eb': { bg: '#b45309', text: '#fff', border: '#92400e' },
  'E':  { bg: '#ca8a04', text: '#fff', border: '#a16207' },   // イエロー
  'F':  { bg: '#16a34a', text: '#fff', border: '#15803d' },   // グリーン
  'F#': { bg: '#0d9488', text: '#fff', border: '#0f766e' },   // ティール
  'Gb': { bg: '#0d9488', text: '#fff', border: '#0f766e' },
  'G':  { bg: '#0891b2', text: '#fff', border: '#0e7490' },   // シアン
  'G#': { bg: '#2563eb', text: '#fff', border: '#1d4ed8' },   // ブルー
  'Ab': { bg: '#2563eb', text: '#fff', border: '#1d4ed8' },
  'A':  { bg: '#7c3aed', text: '#fff', border: '#6d28d9' },   // バイオレット
  'A#': { bg: '#9333ea', text: '#fff', border: '#7e22ce' },   // パープル
  'Bb': { bg: '#9333ea', text: '#fff', border: '#7e22ce' },
  'B':  { bg: '#db2777', text: '#fff', border: '#be185d' },   // ピンク
};

export const INTERVAL_NAMES: IntervalName[] = [
  'R', 'm2', 'M2', 'm3', 'M3', 'P4', '#4/b5', 'P5', 'm6', 'M6', 'm7', 'M7',
];

/** ポジションの表示用ノート名を取得（both対応） */
export function getNoteLabel(
  stringIndex: number,
  fret: number,
  accidental: Accidental = 'sharp'
): string {
  const midiNote = STANDARD_TUNING[stringIndex] + fret;
  const noteIndex = midiNote % 12;
  const sharp = NOTE_NAMES_SHARP[noteIndex];
  const flat = NOTE_NAMES_FLAT[noteIndex];
  if (accidental === 'both' && sharp !== flat) {
    return `${sharp}/${flat}`;
  }
  return accidental === 'flat' ? flat : sharp;
}

/** ポジションのノート名を取得（内部ロジック用、sharpキーで返す） */
export function getNoteAt(
  stringIndex: number,
  fret: number,
  accidental: Accidental = 'sharp'
): string {
  const midiNote = STANDARD_TUNING[stringIndex] + fret;
  const noteIndex = midiNote % 12;
  return accidental === 'flat'
    ? NOTE_NAMES_FLAT[noteIndex]
    : NOTE_NAMES_SHARP[noteIndex]; // both の場合もsharpキーで返す
}

/** ノート名のインデックス (0-11) を取得 */
export function getNoteIndex(note: string): number {
  const sharpIdx = NOTE_NAMES_SHARP.indexOf(note as NoteName);
  if (sharpIdx >= 0) return sharpIdx;
  const flatIdx = NOTE_NAMES_FLAT.indexOf(note as NoteNameFlat);
  return flatIdx >= 0 ? flatIdx : 0;
}

/** ポジションの度数を取得 */
export function getIntervalAt(
  stringIndex: number,
  fret: number,
  rootNote: NoteName
): IntervalName {
  const midiNote = STANDARD_TUNING[stringIndex] + fret;
  const noteIndex = midiNote % 12;
  const rootIndex = getNoteIndex(rootNote);
  const interval = (noteIndex - rootIndex + 12) % 12;
  return INTERVAL_NAMES[interval];
}

/** 特定ノートのすべてのポジションを取得 */
export function getAllPositionsForNote(
  note: string,
  maxFret: number,
  accidental: Accidental = 'sharp'
): FretPosition[] {
  const positions: FretPosition[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      if (getNoteAt(s, f, accidental) === note) {
        positions.push({ string: s, fret: f });
      }
    }
  }
  return positions;
}

/** ランダムなポジションを取得（範囲・音名フィルター対応） */
export function getRandomPosition(
  maxFret: number,
  strings?: number[],
  fretRange?: [number, number],
  noteFilter?: string[] | null,
  accidental: Accidental = 'sharp',
): FretPosition {
  const availableStrings = strings && strings.length > 0 ? strings : [0, 1, 2, 3, 4, 5];
  const minFret = fretRange ? fretRange[0] : 0;
  const maxF = fretRange ? fretRange[1] : maxFret;

  // 音名フィルターがある場合、該当ポジションのみから選択
  if (noteFilter && noteFilter.length > 0) {
    const candidates: FretPosition[] = [];
    for (const s of availableStrings) {
      for (let f = minFret; f <= maxF; f++) {
        if (noteFilter.includes(getNoteAt(s, f, accidental))) {
          candidates.push({ string: s, fret: f });
        }
      }
    }
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  return {
    string: availableStrings[Math.floor(Math.random() * availableStrings.length)],
    fret: minFret + Math.floor(Math.random() * (maxF - minFret + 1)),
  };
}

/** ランダムなノート名を取得（範囲・音名フィルター対応） */
export function getRandomNote(
  accidental: Accidental = 'sharp',
  strings?: number[],
  fretRange?: [number, number],
  maxFret?: number,
  noteFilter?: string[] | null,
): string {
  // 音名フィルターがある場合、そこから選択
  if (noteFilter && noteFilter.length > 0) {
    return noteFilter[Math.floor(Math.random() * noteFilter.length)];
  }
  // 範囲指定がある場合、その範囲に存在するノートのみから選択
  if (strings && fretRange && maxFret !== undefined) {
    const notesInRange = new Set<string>();
    for (const s of strings) {
      for (let f = fretRange[0]; f <= fretRange[1]; f++) {
        notesInRange.add(getNoteAt(s, f, accidental));
      }
    }
    const noteArray = Array.from(notesInRange);
    if (noteArray.length > 0) {
      return noteArray[Math.floor(Math.random() * noteArray.length)];
    }
  }
  const notes = accidental === 'sharp' ? NOTE_NAMES_SHARP : NOTE_NAMES_FLAT;
  return notes[Math.floor(Math.random() * 12)];
}

/** 全ノート名リストを取得 */
export function getNoteNames(accidental: Accidental = 'sharp'): string[] {
  return accidental === 'sharp' ? [...NOTE_NAMES_SHARP] : [...NOTE_NAMES_FLAT];
}

/** 弦の開放弦名を取得 (表示用: 6弦→1弦 = E A D G B E) */
export function getOpenStringName(stringIndex: number): string {
  return getNoteAt(stringIndex, 0, 'sharp');
}
