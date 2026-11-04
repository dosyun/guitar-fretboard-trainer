import type { FretPosition, NoteName } from '../types';
import { getNoteIndex } from './fretboard';

// --- 型定義 ---

export type ScaleName = 'major-pentatonic' | 'minor-pentatonic' | 'major' | 'minor' | 'blues' | 'dorian' | 'mixolydian' | 'altered';

export interface ScaleDefinition {
  name: ScaleName;
  label: string;
  intervals: number[];       // 半音間隔 (ルートからの半音数)
  degreeLabels: string[];    // 各音の度数ラベル
}

// --- スケール定義 ---

export const SCALES: Record<ScaleName, ScaleDefinition> = {
  'major-pentatonic': {
    name: 'major-pentatonic',
    label: 'メジャーペンタ',
    intervals: [0, 2, 4, 7, 9],
    degreeLabels: ['R', '2', '3', '5', '6'],
  },
  'minor-pentatonic': {
    name: 'minor-pentatonic',
    label: 'マイナーペンタ',
    intervals: [0, 3, 5, 7, 10],
    degreeLabels: ['R', 'm3', '4', '5', 'm7'],
  },
  'major': {
    name: 'major',
    label: 'メジャー',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degreeLabels: ['R', '2', '3', '4', '5', '6', '7'],
  },
  'minor': {
    name: 'minor',
    label: 'マイナー',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degreeLabels: ['R', '2', 'm3', '4', '5', 'm6', 'm7'],
  },
  'blues': {
    name: 'blues',
    label: 'ブルース',
    intervals: [0, 3, 5, 6, 7, 10],
    degreeLabels: ['R', 'm3', '4', '♭5', '5', 'm7'],
  },
  'dorian': {
    name: 'dorian',
    label: 'ドリアン',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degreeLabels: ['R', '2', 'm3', '4', '5', '6', 'm7'],
  },
  'mixolydian': {
    name: 'mixolydian',
    label: 'ミクソリドアン',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degreeLabels: ['R', '2', '3', '4', '5', '6', 'm7'],
  },
  'altered': {
    name: 'altered',
    label: 'オルタード',
    intervals: [0, 1, 3, 4, 6, 8, 10],
    degreeLabels: ['R', '♭2', '♭3', '3', '♭5', '♭6', 'm7'],
  },
};

export const SCALE_LIST: ScaleName[] = ['major-pentatonic', 'minor-pentatonic', 'major', 'minor', 'blues', 'dorian', 'mixolydian', 'altered'];

// --- ボックスポジション (5ポジション) ---
// 各ポジションはフレット範囲で区切る。ルートの位置を基準に定義。
// ペンタトニック5ポジションは標準的なパターンに対応。

export interface BoxPosition {
  label: string;         // "Position 1" etc.
  // 各弦のフレットオフセット (ルートフレットからの相対, [low, high])
  // 弦ごとに弾く音のオフセット一覧
  stringOffsets: { string: number; offsets: number[] }[];
}

// ポジション定義はルートからの半音オフセットで構成
// 汎用的に: スケール内の全音を指板上で特定し、フレット範囲で5つに分割する

/** スケールの全ポジションを取得 */
export function getScalePositions(
  scaleName: ScaleName,
  rootNote: NoteName,
  maxFret: number = 22,
): { pos: FretPosition; degree: string }[] {
  const scale = SCALES[scaleName];
  const rootIndex = getNoteIndex(rootNote);
  const scaleNoteIndices = scale.intervals.map((i) => (rootIndex + i) % 12);

  const tuning = [40, 45, 50, 55, 59, 64]; // MIDI: E A D G B E
  const results: { pos: FretPosition; degree: string }[] = [];

  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const noteIndex = (tuning[s] + f) % 12;
      const scaleIdx = scaleNoteIndices.indexOf(noteIndex);
      if (scaleIdx >= 0) {
        results.push({
          pos: { string: s, fret: f },
          degree: scale.degreeLabels[scaleIdx],
        });
      }
    }
  }

  return results;
}

export type ScaleBox = { boxIndex: number; fretRange: [number, number]; positions: { pos: FretPosition; degree: string }[] };

const PENTATONIC_SCALES: ScaleName[] = ['minor-pentatonic', 'major-pentatonic', 'blues'];
const MINOR_PENTA_INTERVALS = [0, 3, 5, 7, 10];
const TUNING = [40, 45, 50, 55, 59, 64]; // MIDI: E A D G B E

export function isPentatonicBoxScale(scaleName: ScaleName): boolean {
  return PENTATONIC_SCALES.includes(scaleName);
}

/**
 * 5つのボックスポジションに分割
 * ペンタ系（マイナー・メジャー・ブルース）は各弦2音ずつの標準の5ポジション。
 * 7音スケールはフレット幅で機械的に区切った目安（getFretSliceBoxes）。
 */
export function getScaleBoxPositions(
  scaleName: ScaleName,
  rootNote: NoteName,
  maxFret: number = 22,
): ScaleBox[] {
  return isPentatonicBoxScale(scaleName)
    ? getPentatonicBoxes(scaleName, rootNote, maxFret)
    : getFretSliceBoxes(scaleName, rootNote, maxFret);
}

/**
 * ペンタの5ポジション。6弦のマイナーペンタのルートから低い順に5音を並べ、
 * 第k箱はk番目の音から12音を各弦2音ずつ6弦→1弦に割り当てる（Aマイナーなら第1が5〜8F）。
 * メジャーペンタは同じ5音のマイナーペンタ（短3度下）と同じ箱を同じ番号にする（Cメジャーの第1＝Aマイナーの第1）。
 * ブルースはマイナーペンタの箱に、箱のフレット範囲に入る♭5を足す。
 * 箱が maxFret をはみ出すときは12フレット下と比べ、見える音が多い方に置く（同数なら元の位置）。
 */
function getPentatonicBoxes(scaleName: ScaleName, rootNote: NoteName, maxFret: number): ScaleBox[] {
  const scale = SCALES[scaleName];
  const rootIndex = getNoteIndex(rootNote);
  const minorRoot = scaleName === 'major-pentatonic' ? (rootIndex + 9) % 12 : rootIndex;
  const startPitch = TUNING[0] + (minorRoot - TUNING[0] % 12 + 12) % 12;

  // 6弦のマイナーペンタのルートから上へ、16音（第5箱の最後の音まで）
  const pitches: number[] = [];
  for (let p = startPitch; pitches.length < 16; p++) {
    if (MINOR_PENTA_INTERVALS.includes((p - startPitch) % 12)) pitches.push(p);
  }

  const degreeOf = (string: number, fret: number) => {
    const idx = scale.intervals.indexOf(((TUNING[string] + fret) % 12 - rootIndex + 12) % 12);
    return scale.degreeLabels[idx];
  };
  const visible = (fret: number) => fret >= 0 && fret <= maxFret;

  return [0, 1, 2, 3, 4].map((boxIndex) => {
    const frets = pitches
      .slice(boxIndex, boxIndex + 12)
      .map((p, i) => ({ string: Math.floor(i / 2), fret: p - TUNING[Math.floor(i / 2)] }));
    const lowered = frets.map((f) => ({ ...f, fret: f.fret - 12 }));
    const countVisible = (fs: typeof frets) => fs.filter((f) => visible(f.fret)).length;
    const chosen = (countVisible(lowered) > countVisible(frets) ? lowered : frets).filter((f) => visible(f.fret));

    const fretValues = chosen.map((f) => f.fret);
    const fretRange: [number, number] = [Math.min(...fretValues), Math.max(...fretValues)];

    const positions = chosen.map(({ string, fret }) => ({ pos: { string, fret }, degree: degreeOf(string, fret) }));
    if (scaleName === 'blues') {
      for (const p of getScalePositions(scaleName, rootNote, maxFret)) {
        if (p.degree === '♭5' && p.pos.fret >= fretRange[0] && p.pos.fret <= fretRange[1]) positions.push(p);
      }
    }
    positions.sort((a, b) => a.pos.string - b.pos.string || a.pos.fret - b.pos.fret);

    return { boxIndex, fretRange, positions };
  });
}

/** 7音スケール用: 6弦ルートの1フレット手前から一定幅で5つに区切る */
function getFretSliceBoxes(
  scaleName: ScaleName,
  rootNote: NoteName,
  maxFret: number,
): ScaleBox[] {
  const allPositions = getScalePositions(scaleName, rootNote, maxFret);

  // ルート音のフレット位置を6弦で見つける（基準点）
  const rootIndex = getNoteIndex(rootNote);
  const tuning6 = 40; // 6弦 E
  let rootFret6 = (rootIndex - tuning6 % 12 + 12) % 12;
  if (rootFret6 === 0) rootFret6 = 12; // 開放弦の場合は12Fを基準に

  // シンプルなアプローチ: フレット範囲を4フレット幅で5つに分割
  const boxWidth = 4;

  // ルートの6弦ポジションを基準にボックスを配置
  const boxStarts: number[] = [];
  let startFret = rootFret6 - 1; // Position 1はルートの少し手前から
  if (startFret < 0) startFret += 12;

  for (let i = 0; i < 5; i++) {
    boxStarts.push(startFret);
    startFret += boxWidth;
    if (startFret > maxFret) startFret -= 12;
  }

  // 各ボックスにポジションを割り当て
  return boxStarts.map((start, i) => {
    const end = start + boxWidth;
    const positions = allPositions.filter(({ pos }) => {
      if (start <= end) {
        return pos.fret >= start && pos.fret <= end;
      }
      // wrap around (e.g., start=11, end=14 on a 12-fret guitar)
      return pos.fret >= start || pos.fret <= (end % (maxFret + 1));
    });

    return {
      boxIndex: i,
      fretRange: [start, Math.min(end, maxFret)] as [number, number],
      positions,
    };
  });
}

/** スケール色 */
export const SCALE_COLORS: Record<ScaleName, { bg: string; border: string; light: string }> = {
  'major-pentatonic': { bg: '#ea580c', border: '#c2410c', light: '#fed7aa' },
  'minor-pentatonic': { bg: '#2563eb', border: '#1d4ed8', light: '#bfdbfe' },
  'major': { bg: '#16a34a', border: '#15803d', light: '#bbf7d0' },
  'minor': { bg: '#7c3aed', border: '#6d28d9', light: '#ddd6fe' },
  'blues': { bg: '#b45309', border: '#92400e', light: '#fde68a' },
  'dorian': { bg: '#0891b2', border: '#0e7490', light: '#cffafe' },
  'mixolydian': { bg: '#15803d', border: '#166534', light: '#bbf7d0' },
  'altered': { bg: '#be123c', border: '#9f1239', light: '#fecdd3' },
};

/** スケール内の音かどうか判定 */
export function isInScale(
  scaleName: ScaleName,
  rootNote: NoteName,
  stringIndex: number,
  fret: number,
): { inScale: boolean; degree: string | null } {
  const scale = SCALES[scaleName];
  const rootIdx = getNoteIndex(rootNote);
  const tuning = [40, 45, 50, 55, 59, 64];
  const noteIdx = (tuning[stringIndex] + fret) % 12;
  const interval = (noteIdx - rootIdx + 12) % 12;
  const scaleIdx = scale.intervals.indexOf(interval);
  if (scaleIdx >= 0) {
    return { inScale: true, degree: scale.degreeLabels[scaleIdx] };
  }
  return { inScale: false, degree: null };
}

/** ランダムなスケール内ポジションを取得 */
export function getRandomScalePosition(
  scaleName: ScaleName,
  rootNote: NoteName,
  maxFret: number,
  boxFretRange?: [number, number],
): { pos: FretPosition; degree: string } | null {
  let positions = getScalePositions(scaleName, rootNote, maxFret);
  if (boxFretRange) {
    positions = positions.filter(
      ({ pos }) => pos.fret >= boxFretRange[0] && pos.fret <= boxFretRange[1]
    );
  }
  if (positions.length === 0) return null;
  return positions[Math.floor(Math.random() * positions.length)];
}
