// レベルごとの数値（音数・跳躍・最初の音・キー）は PHRASE_LEVELS に集約する。
import { getMidiAt } from './fretboard';
import type { FretPosition } from '../types';

export type PhraseLevel = 1 | 2 | 3 | 4;
export type PhraseMode = 'major' | 'minor';
export interface PhraseKey { root: number; mode: PhraseMode }
export interface PhraseRange { strings: number[]; fretRange: [number, number]; notes?: number[] }
export interface EarPhrase {
  level: PhraseLevel;
  key: PhraseKey;
  midis: number[];
  degrees: number[];
  positions: FretPosition[];
}
interface PhraseLevelConfig {
  minNotes: number;
  maxNotes: number;
  maxScaleStep: number;
  showFirst: boolean;
  allowOctave: boolean;
  keys: PhraseKey[];
}
const ALL_MAJOR: PhraseKey[] = Array.from({ length: 12 }, (_, root) => ({ root, mode: 'major' }));
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] } as const;

/** 音数・跳躍・キー・表示・判定のレベル調整はここにまとめる。 */
export const PHRASE_LEVELS: Record<PhraseLevel, PhraseLevelConfig> = {
  1: { minNotes: 2, maxNotes: 3, maxScaleStep: 1, showFirst: true, allowOctave: true, keys: [ALL_MAJOR[0]] },
  2: { minNotes: 3, maxNotes: 3, maxScaleStep: 2, showFirst: true, allowOctave: true, keys: [ALL_MAJOR[0], ALL_MAJOR[7], ALL_MAJOR[5]] },
  3: { minNotes: 4, maxNotes: 4, maxScaleStep: 4, showFirst: false, allowOctave: false, keys: ALL_MAJOR },
  4: { minNotes: 4, maxNotes: 5, maxScaleStep: 7, showFirst: false, allowOctave: false, keys: [...ALL_MAJOR, ...ALL_MAJOR.map(({ root }): PhraseKey => ({ root, mode: 'minor' }))] },
};

export function createPhraseRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(values: T[], rng: () => number): T {
  return values[Math.min(values.length - 1, Math.max(0, Math.floor(rng() * values.length)))];
}
function pitchClass(midi: number): number { return ((midi % 12) + 12) % 12; }

function rangePositions(range: PhraseRange): FretPosition[] {
  const [min, max] = range.fretRange;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min) return [];
  const positions: FretPosition[] = [];
  for (const string of [...new Set(range.strings)]) {
    if (!Number.isInteger(string) || string < 0 || string > 5) continue;
    for (let fret = min; fret <= max; fret += 1) {
      if (!range.notes?.length || range.notes.includes(pitchClass(getMidiAt(string, fret)))) {
        positions.push({ string, fret });
      }
    }
  }
  return positions;
}

function degreeIndex(midi: number, key: PhraseKey): number {
  return SCALE[key.mode].findIndex((semitones) => semitones === pitchClass(midi - key.root));
}
function scaleRank(midi: number, key: PhraseKey): number {
  return Math.floor((midi - key.root) / 12) * 7 + degreeIndex(midi, key);
}
export function getPhraseScalePositions(key: PhraseKey, range: PhraseRange): FretPosition[] {
  return rangePositions(range).filter((pos) => degreeIndex(getMidiAt(pos.string, pos.fret), key) >= 0);
}
export function getPhraseDegreeLabels(phrase: EarPhrase): string[] {
  const labels = phrase.key.mode === 'major'
    ? ['1', '2', '3', '4', '5', '6', '7']
    : ['1', '2', 'b3', '4', '5', 'b6', 'b7'];
  return phrase.midis.map((midi) => labels[degreeIndex(midi, phrase.key)]);
}
export function getPhraseMotion(midis: number[]): ('up' | 'down' | 'same')[] {
  return midis.slice(1).map((midi, index) => midi > midis[index] ? 'up' : midi < midis[index] ? 'down' : 'same');
}
export function judgeEarPhrase(expected: number[], answer: number[], allowOctave: boolean): boolean {
  return expected.length > 0 && expected.length === answer.length
    && expected.every((midi, index) => Number.isInteger(midi) && Number.isInteger(answer[index])
      && (allowOctave ? pitchClass(midi) === pitchClass(answer[index]) : midi === answer[index]));
}

export function generateEarPhrase({
  level, range, rng = Math.random,
}: { level: PhraseLevel; range: PhraseRange; rng?: () => number }): EarPhrase | null {
  const config = PHRASE_LEVELS[level];
  const candidates = config.keys.map((key) => {
    const positions = getPhraseScalePositions(key, range);
    const midis = [...new Set(positions.map((pos) => getMidiAt(pos.string, pos.fret)))].sort((a, b) => a - b);
    const neighbors = new Map(midis.map((midi) => [midi, midis.filter((next) => {
      const distance = Math.abs(scaleRank(next, key) - scaleRank(midi, key));
      return distance <= config.maxScaleStep && (level !== 1 || distance === 1);
    })]));
    const memo = new Map<string, boolean>();
    const canFinish = (midi: number, remaining: number, moved: boolean): boolean => {
      if (remaining === 0) return moved;
      const cacheKey = `${midi}:${remaining}:${moved}`;
      if (!memo.has(cacheKey)) {
        memo.set(cacheKey, (neighbors.get(midi) ?? []).some((next) => canFinish(next, remaining - 1, moved || next !== midi)));
      }
      return memo.get(cacheKey)!;
    };
    const lengths = Array.from({ length: config.maxNotes - config.minNotes + 1 }, (_, i) => i + config.minNotes)
      .filter((length) => midis.some((midi) => canFinish(midi, length - 1, false)));
    return { key, positions, midis, neighbors, canFinish, lengths };
  }).filter(({ lengths }) => lengths.length > 0);
  if (candidates.length === 0) return null;
  const candidate = pick(candidates, rng);
  const length = pick(candidate.lengths, rng);
  const midis = [pick(candidate.midis.filter((midi) => candidate.canFinish(midi, length - 1, false)), rng)];
  let moved = false;
  while (midis.length < length) {
    const previous = midis[midis.length - 1];
    const next = pick((candidate.neighbors.get(previous) ?? []).filter((midi) =>
      candidate.canFinish(midi, length - midis.length - 1, moved || midi !== previous)), rng);
    midis.push(next);
    moved ||= next !== previous;
  }
  return {
    level, key: { ...candidate.key }, midis,
    degrees: midis.map((midi) => degreeIndex(midi, candidate.key) + 1),
    positions: midis.map((midi) => pick(candidate.positions.filter((pos) => getMidiAt(pos.string, pos.fret) === midi), rng)),
  };
}

/** 音域・旋律の動きを保ったまま、範囲内で弾ける別のキーへ移す。 */
export function transposeEarPhrase(phrase: EarPhrase, range: PhraseRange, rng: () => number = Math.random): EarPhrase | null {
  const positions = rangePositions(range);
  const available = new Set(positions.map((pos) => getMidiAt(pos.string, pos.fret)));
  if (positions.length === 0 || phrase.midis.length === 0) return null;
  const availableMidis = [...available];
  const minShift = Math.min(...availableMidis) - Math.min(...phrase.midis);
  const maxShift = Math.max(...availableMidis) - Math.max(...phrase.midis);
  const shifts: number[] = [];
  for (let shift = minShift; shift <= maxShift; shift += 1) {
    if (pitchClass(shift) !== 0 && phrase.midis.every((midi) => available.has(midi + shift))) shifts.push(shift);
  }
  if (shifts.length === 0) return null;
  const shift = pick(shifts, rng);
  const midis = phrase.midis.map((midi) => midi + shift);
  return {
    level: phrase.level, key: { root: pitchClass(phrase.key.root + shift), mode: phrase.key.mode },
    midis, degrees: [...phrase.degrees],
    positions: midis.map((midi) => pick(positions.filter((pos) => getMidiAt(pos.string, pos.fret) === midi), rng)),
  };
}
