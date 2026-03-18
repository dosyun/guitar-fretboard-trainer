import type { CagedFormName, ChordTone, ChordType, PentatonicDegree, FretPosition, NoteName } from '../types';
import { getNoteIndex } from './fretboard';

// --- 型定義 ---

export interface CagedPosition {
  string: number;
  fretOffset: number;
  chordTone?: ChordTone;
  pentatonic?: PentatonicDegree;
}

export interface CagedForm {
  name: CagedFormName;
  rootString: number;
  rootFretForC: number;
  positions: CagedPosition[];
}

// --- フォーム色 ---

export const CAGED_COLORS: Record<CagedFormName, { bg: string; border: string; light: string }> = {
  C: { bg: '#dc2626', border: '#b91c1c', light: '#fecaca' },
  A: { bg: '#2563eb', border: '#1d4ed8', light: '#bfdbfe' },
  G: { bg: '#16a34a', border: '#15803d', light: '#bbf7d0' },
  E: { bg: '#ea580c', border: '#c2410c', light: '#fed7aa' },
  D: { bg: '#7c3aed', border: '#6d28d9', light: '#ddd6fe' },
};

// --- コードタイプ定義 ---

export interface ChordTypeDefinition {
  name: ChordType;
  label: string;
}

export const CHORD_TYPES: Record<ChordType, ChordTypeDefinition> = {
  major: { name: 'major', label: 'メジャー' },
  '7':   { name: '7',     label: '7th' },
  maj7:  { name: 'maj7',  label: 'M7' },
  m7:    { name: 'm7',    label: 'm7' },
  m7b5:  { name: 'm7b5',  label: 'm7(♭5)' },
};

export const CHORD_TYPE_LIST: ChordType[] = ['major', '7', 'maj7', 'm7', 'm7b5'];

// --- 手動フォーム定義 ---
// 全てキーC基準。fretOffsetはrootFretForCからの相対値。
// 各フォーム×コードタイプのコードトーンを正確に定義。
const TUNING = [40, 45, 50, 55, 59, 64];

function noteAt(s: number, fret: number): number {
  return (TUNING[s] + fret) % 12;
}

// Chord type intervals (semitones from root → tone label)
const CHORD_INTERVALS: Record<ChordType, Map<number, ChordTone>> = {
  major: new Map([[0, 'R'], [4, '3'], [7, '5']]),
  '7':   new Map([[0, 'R'], [4, '3'], [7, '5'], [10, 'm7']]),
  maj7:  new Map([[0, 'R'], [4, '3'], [7, '5'], [11, '7']]),
  m7:    new Map([[0, 'R'], [3, 'm3'], [7, '5'], [10, 'm7']]),
  m7b5:  new Map([[0, 'R'], [3, 'm3'], [6, 'b5'], [10, 'm7']]),
};

// Pentatonic (major): 0=R, 2=2, 4=3, 7=5, 9=6
const PENTA_MAP = new Map<number, PentatonicDegree>([[0, 'R'], [2, '2'], [4, '3'], [7, '5'], [9, '6']]);

// Each CAGED form defined as: rootString, rootFretForC, and the SHAPE
// (which string+fretOffset positions to USE, based on the open chord shape)
// These positions are the "playable" positions in the form.
interface FormShape {
  name: CagedFormName;
  rootString: number;
  rootFretForC: number;
  // All positions in the form (string, fretOffset from rootFret)
  // These are ALL the frets a player would use in this shape
  shape: { string: number; fretOffset: number }[];
}

// Define shapes based on traditional CAGED open chord fingerings
const FORM_SHAPES: FormShape[] = [
  {
    // C shape: open C chord = x 3 2 0 1 0
    name: 'C', rootString: 1, rootFretForC: 3,
    shape: [
      { string: 1, fretOffset: 0 },    // 5弦3F
      { string: 2, fretOffset: -2 },   // 4弦1F (for m3)
      { string: 2, fretOffset: -1 },   // 4弦2F
      { string: 3, fretOffset: -3 },   // 3弦0F
      { string: 3, fretOffset: -2 },   // 3弦1F (for b5)
      { string: 3, fretOffset: -1 },   // 3弦2F
      { string: 3, fretOffset: 0 },    // 3弦3F (for m7)
      { string: 4, fretOffset: -3 },   // 2弦0F (for maj7)
      { string: 4, fretOffset: -2 },   // 2弦1F
      { string: 5, fretOffset: -4 },   // 1弦-1F → skip if < 0 (for m3: Eb)
      { string: 5, fretOffset: -3 },   // 1弦0F
      { string: 5, fretOffset: -2 },   // 1弦1F
    ],
  },
  {
    // A shape: open A chord = x 0 2 2 2 0, barre version at fret 3 for C
    name: 'A', rootString: 1, rootFretForC: 3,
    shape: [
      { string: 1, fretOffset: 0 },    // 5弦3F (R)
      { string: 2, fretOffset: 2 },    // 4弦5F
      { string: 2, fretOffset: 1 },    // 4弦4F (for m7 of some keys)
      { string: 3, fretOffset: 2 },    // 3弦5F
      { string: 3, fretOffset: 1 },    // 3弦4F (for maj7, m3)
      { string: 3, fretOffset: 0 },    // 3弦3F (for m7)
      { string: 4, fretOffset: 2 },    // 2弦5F
      { string: 4, fretOffset: 1 },    // 2弦4F (for m3)
      { string: 5, fretOffset: 0 },    // 1弦3F (barre)
      { string: 5, fretOffset: -1 },   // 1弦2F (for 7th)
    ],
  },
  {
    // G shape: open G chord = 3 2 0 0 0 3 → for C at 8th fret area
    name: 'G', rootString: 0, rootFretForC: 8,
    shape: [
      { string: 0, fretOffset: 0 },    // 6弦8F (R)
      { string: 1, fretOffset: -1 },   // 5弦7F
      { string: 1, fretOffset: -2 },   // 5弦6F (for m3 of some keys)
      { string: 2, fretOffset: -3 },   // 4弦5F
      { string: 2, fretOffset: -2 },   // 4弦6F (for m3)
      { string: 2, fretOffset: 0 },    // 4弦8F (for m7)
      { string: 3, fretOffset: -3 },   // 3弦5F
      { string: 3, fretOffset: -2 },   // 3弦6F (for b5)
      { string: 4, fretOffset: -3 },   // 2弦5F
      { string: 5, fretOffset: 0 },    // 1弦8F
      { string: 5, fretOffset: -1 },   // 1弦7F (for maj7)
      { string: 5, fretOffset: -2 },   // 1弦6F (for m7)
    ],
  },
  {
    // E shape: open E chord = 0 2 2 1 0 0 → barre at 8 for C
    name: 'E', rootString: 0, rootFretForC: 8,
    shape: [
      { string: 0, fretOffset: 0 },    // 6弦8F (R)
      { string: 1, fretOffset: 2 },    // 5弦10F
      { string: 1, fretOffset: 1 },    // 5弦9F (for m7 of some keys)
      { string: 2, fretOffset: 2 },    // 4弦10F
      { string: 2, fretOffset: 1 },    // 4弦9F (for m3, b5)
      { string: 2, fretOffset: 0 },    // 4弦8F (for m7)
      { string: 3, fretOffset: 1 },    // 3弦9F
      { string: 3, fretOffset: 0 },    // 3弦8F (for m3)
      { string: 4, fretOffset: 0 },    // 2弦8F
      { string: 4, fretOffset: -1 },   // 2弦7F (for maj7)
      { string: 5, fretOffset: 0 },    // 1弦8F
      { string: 5, fretOffset: -2 },   // 1弦6F (for m7)
    ],
  },
  {
    // D shape: open D chord = x x 0 2 3 2 → for C at 10th fret area
    name: 'D', rootString: 2, rootFretForC: 10,
    shape: [
      { string: 2, fretOffset: -2 },   // 4弦8F (for m7)
      { string: 2, fretOffset: 0 },    // 4弦10F (R)
      { string: 3, fretOffset: 2 },    // 3弦12F
      { string: 3, fretOffset: 1 },    // 3弦11F (for maj7, m3)
      { string: 4, fretOffset: 3 },    // 2弦13F
      { string: 4, fretOffset: 2 },    // 2弦12F (for m3)
      { string: 4, fretOffset: 1 },    // 2弦11F (for m7)
      { string: 5, fretOffset: 2 },    // 1弦12F
      { string: 5, fretOffset: 1 },    // 1弦11F (for m3)
    ],
  },
];

// Pentatonic shapes (major pentatonic, key of C)
const PENTA_SHAPES: Record<CagedFormName, { string: number; fretOffset: number }[]> = {
  C: [
    { string: 0, fretOffset: -3 }, { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: -3 }, { string: 1, fretOffset: 0 },
    { string: 2, fretOffset: -3 }, { string: 2, fretOffset: -1 },
    { string: 3, fretOffset: -3 }, { string: 3, fretOffset: -1 },
    { string: 4, fretOffset: -2 }, { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: -3 }, { string: 5, fretOffset: 0 },
  ],
  A: [
    { string: 0, fretOffset: 0 }, { string: 0, fretOffset: 2 },
    { string: 1, fretOffset: 0 }, { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: -1 }, { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: -1 }, { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 0 }, { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 }, { string: 5, fretOffset: 2 },
  ],
  G: [
    { string: 0, fretOffset: -3 }, { string: 0, fretOffset: 0 },
    { string: 1, fretOffset: -3 }, { string: 1, fretOffset: -1 },
    { string: 2, fretOffset: -3 }, { string: 2, fretOffset: -1 },
    { string: 3, fretOffset: -3 }, { string: 3, fretOffset: -1 },
    { string: 4, fretOffset: -3 }, { string: 4, fretOffset: 0 },
    { string: 5, fretOffset: -3 }, { string: 5, fretOffset: 0 },
  ],
  E: [
    { string: 0, fretOffset: 0 }, { string: 0, fretOffset: 2 },
    { string: 1, fretOffset: -1 }, { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: -1 }, { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: -1 }, { string: 3, fretOffset: 1 },
    { string: 4, fretOffset: 0 }, { string: 4, fretOffset: 2 },
    { string: 5, fretOffset: 0 }, { string: 5, fretOffset: 2 },
  ],
  D: [
    { string: 1, fretOffset: 0 }, { string: 1, fretOffset: 2 },
    { string: 2, fretOffset: 0 }, { string: 2, fretOffset: 2 },
    { string: 3, fretOffset: 0 }, { string: 3, fretOffset: 2 },
    { string: 4, fretOffset: 0 }, { string: 4, fretOffset: 3 },
    { string: 5, fretOffset: 0 }, { string: 5, fretOffset: 2 },
  ],
};

/** フォームをビルド: shapeの各ポジションが指定コードタイプの構成音かチェック */
function buildForm(
  formShape: FormShape,
  chordType: ChordType,
): CagedForm {
  const intervals = CHORD_INTERVALS[chordType];
  const rootNoteC = 0; // C = 0
  const positions: CagedPosition[] = [];
  const seen = new Set<string>();

  // コードトーン
  for (const sp of formShape.shape) {
    const fret = formShape.rootFretForC + sp.fretOffset;
    if (fret < 0) continue;
    const noteIdx = noteAt(sp.string, fret);
    const interval = (noteIdx - rootNoteC + 12) % 12;
    const tone = intervals.get(interval);
    if (tone) {
      const key = `${sp.string}-${sp.fretOffset}`;
      if (!seen.has(key)) {
        seen.add(key);
        const pentaDeg = PENTA_MAP.get(interval);
        positions.push({
          string: sp.string,
          fretOffset: sp.fretOffset,
          chordTone: tone,
          pentatonic: pentaDeg,
        });
      }
    }
  }

  // ペンタトニック
  const pentaShape = PENTA_SHAPES[formShape.name];
  for (const sp of pentaShape) {
    const fret = formShape.rootFretForC + sp.fretOffset;
    if (fret < 0) continue;
    const noteIdx = noteAt(sp.string, fret);
    const interval = (noteIdx - rootNoteC + 12) % 12;
    const pentaDeg = PENTA_MAP.get(interval);
    if (pentaDeg) {
      const key = `${sp.string}-${sp.fretOffset}`;
      if (!seen.has(key)) {
        seen.add(key);
        positions.push({
          string: sp.string,
          fretOffset: sp.fretOffset,
          pentatonic: pentaDeg,
        });
      }
    }
  }

  return {
    name: formShape.name,
    rootString: formShape.rootString,
    rootFretForC: formShape.rootFretForC,
    positions,
  };
}

// --- エクスポート ---

export const CAGED_FORMS: Record<CagedFormName, CagedForm> = Object.fromEntries(
  FORM_SHAPES.map((fs) => [fs.name, buildForm(fs, 'major')])
) as Record<CagedFormName, CagedForm>;

export const CAGED_ORDER: CagedFormName[] = ['C', 'A', 'G', 'E', 'D'];

// --- ユーティリティ ---

function getTranspose(rootNote: NoteName): number {
  return getNoteIndex(rootNote);
}

/** CAGEDフォームを任意のキー・コードタイプで取得 */
export function getCagedPositions(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
  chordType: ChordType = 'major',
): { pos: FretPosition; chordTone?: ChordTone; pentatonic?: PentatonicDegree }[] {
  const formShape = FORM_SHAPES.find((fs) => fs.name === formName)!;
  const form = buildForm(formShape, chordType);
  const transpose = getTranspose(rootNote);

  // フォームの自然なルートフレット位置を計算し、表示範囲内に収める
  const naturalRootFret = form.rootFretForC + transpose;
  let adjustedRootFret = naturalRootFret;
  while (adjustedRootFret > maxFret) adjustedRootFret -= 12;
  while (adjustedRootFret < 0) adjustedRootFret += 12;

  const results: { pos: FretPosition; chordTone?: ChordTone; pentatonic?: PentatonicDegree }[] = [];
  const seen = new Set<string>();

  // 自然な位置と+12オクターブ上の位置を表示
  for (const rootOffset of [0, 12]) {
    const rootFret = adjustedRootFret + rootOffset;
    for (const p of form.positions) {
      const fret = rootFret + p.fretOffset;
      if (fret >= 0 && fret <= maxFret) {
        const key = `${p.string}-${fret}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            pos: { string: p.string, fret },
            chordTone: p.chordTone,
            pentatonic: p.pentatonic,
          });
        }
      }
    }
  }

  return results;
}

/** コードトーンのみ取得 */
export function getCagedChordTones(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
  chordType: ChordType = 'major',
) {
  return getCagedPositions(formName, rootNote, maxFret, chordType).filter((p) => p.chordTone);
}

/** ペンタトニック音のみ取得 */
export function getCagedPentatonic(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
  chordType: ChordType = 'major',
) {
  return getCagedPositions(formName, rootNote, maxFret, chordType).filter((p) => p.pentatonic);
}

/** 全5フォームを取得 */
export function getAllCagedForms(rootNote: NoteName, maxFret: number = 22, chordType: ChordType = 'major') {
  return CAGED_ORDER.map((name) => ({
    name,
    positions: getCagedPositions(name, rootNote, maxFret, chordType),
  }));
}
