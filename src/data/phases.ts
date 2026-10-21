/**
 * 段階の範囲・覚え方・目標はここを正とする。ロックは設けない。
 * computePhaseStatus は既存記録による音名の到達判定だけを担当する。
 */
import { getCellStats } from './practiceStore';
import { getNoteAt, INTERVAL_NAMES } from './fretboard';
import { cellKey } from '../types/practice';
import type { FretPosition, IntervalName, QuizMode } from '../types';

const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL_STRINGS = [0, 1, 2, 3, 4, 5];
const MIN_N = 3;
const CLEAR_RATIO = 0.9;
export const STAGE_GUIDED_COUNT = 3;
export const STAGE_TEST_COUNT = 10;
export const STAGE_REQUIRED_CORRECT = 9;

export interface Phase {
  id: string;
  title: string;
  scope: string;
  mode: QuizMode;
  strings: number[];
  fretRange: [number, number];
  notes: string[] | null;
  targetAcc: number;
  targetMs: number;
  kind: 'note' | 'degree';
  rule: string;
  markers: FretPosition[];
  degrees: IntervalName[];
  lessonId: 'notes' | 'octave' | 'degree';
}
const positions = (string: number, frets: number[]): FretPosition[] =>
  frets.map((fret) => ({ string, fret }));
const opens = ALL_STRINGS.map((string) => ({ string, fret: 0 }));
function noteStage(
  id: string, title: string, scope: string, strings: number[],
  fretRange: [number, number], notes: string[] | null, targetMs: number,
  rule: string, markers: FretPosition[], lessonId: Phase['lessonId'] = 'notes',
): Phase {
  return { id, title, scope, strings, fretRange, notes, targetMs, rule, markers, lessonId,
    mode: 'position-to-note', kind: 'note', targetAcc: 0.9, degrees: [] };
}
function degreeStage(
  id: string, title: string, degrees: IntervalName[], targetMs: number,
  rule: string, markers: FretPosition[],
): Phase {
  return { id, title, degrees, targetMs, rule, markers, kind: 'degree', mode: 'interval',
    scope: 'ルートを見て度数を答える / 0-12F', strings: ALL_STRINGS,
    fretRange: [0, 12], notes: null, targetAcc: 0.9, lessonId: 'degree' };
}

export const PHASES: Phase[] = [
  noteStage('open-strings', '開放弦', '全弦 / 0F / 全音',
    ALL_STRINGS, [0, 0], null, 2000,
    '6弦から順に E A D G B E。太い弦から読みます。', opens),
  noteStage('string6-naturals', '6弦のナチュラル音', '6弦 / 0-12F / ナチュラル',
    [0], [0, 12], NATURALS, 2500,
    'E-F と B-C は1フレット、ほかの隣り合う音は2フレット。開放 E から数えます。',
    positions(0, [0, 1, 3, 5, 7, 8, 10, 12])),
  noteStage('string5-naturals', '5弦のナチュラル音', '5弦 / 0-12F / ナチュラル',
    [1], [0, 12], NATURALS, 2500,
    'E-F と B-C は1フレット、ほかの隣り合う音は2フレット。開放 A から数えます。',
    positions(1, [0, 2, 3, 5, 7, 8, 10, 12])),
  noteStage('fret5-bridge', '5フレット＝細い隣の弦の開放', '全弦 / 0-5F / ナチュラル',
    ALL_STRINGS, [0, 5], NATURALS, 2500,
    '5フレットは細い隣の弦の開放音と同じ。3弦だけは4フレットが2弦の開放 B です。',
    [...opens, ...[0, 1, 2, 4].map((string) => ({ string, fret: 5 })), { string: 3, fret: 4 }]),
  noteStage('octave-shape', 'オクターブの形', '全弦 / 0-12F / ナチュラル',
    ALL_STRINGS, [0, 12], NATURALS, 2200,
    '同じ音は2本細い弦の2フレット先。3弦と2弦の間をまたぐと3フレット先です。',
    [{ string: 0, fret: 3 }, { string: 2, fret: 5 }, { string: 4, fret: 8 },
      { string: 1, fret: 3 }, { string: 3, fret: 5 }, { string: 5, fret: 8 }], 'octave'),
  noteStage('sharps-flats', 'シャープとフラット', '全弦 / 0-12F / 全音',
    ALL_STRINGS, [0, 12], null, 2500,
    'ナチュラル音の1フレット右が ♯、左が ♭。同じ場所に2つの名前があります。',
    positions(0, [1, 2, 3])),
  degreeStage('deg-power', '5度とオクターブ', ['R', 'P5'], 2500,
    '5度は細い隣の弦の2フレット先。オクターブは2本細い弦の2フレット先です。',
    [{ string: 1, fret: 7 }, { string: 2, fret: 7 }]),
  degreeStage('deg-fourth', '4度', ['R', 'P5', 'P4'], 2500,
    '4度は細い隣の弦の同じフレットです。',
    [{ string: 1, fret: 5 }, { string: 1, fret: 7 }, { string: 2, fret: 7 }]),
  degreeStage('deg-thirds', '長3度・短3度', ['R', 'P5', 'P4', 'M3', 'm3'], 2500,
    '長3度は細い隣の弦の1フレット手前、短3度は2フレット手前です。',
    [{ string: 1, fret: 4 }, { string: 1, fret: 3 }]),
  degreeStage('deg-rest', '7度・2度・6度', [...INTERVAL_NAMES], 3000,
    '短7度は2本細い弦の同じフレット、長7度は1フレット先、長6度は1フレット手前。長2度は同じ弦の2フレット先です。',
    [{ string: 2, fret: 5 }, { string: 2, fret: 6 }, { string: 2, fret: 4 }, { string: 0, fret: 7 }]),
  degreeStage('deg-cross', '2弦をまたぐ形', [...INTERVAL_NAMES], 3000,
    '3弦と2弦の間をまたぐと、同じ形が1フレット右にずれます。例: 4弦7F のオクターブ上は、2フレット先ではなく3フレット先の2弦10F です。',
    [{ string: 2, fret: 7 }, { string: 4, fret: 10 }]),
];

export interface PhaseStatus {
  total: number;
  mastered: number;
  progress: number;
  accuracy: number;
  avgMs: number;
  started: boolean;
  clear: boolean;
}
export function computePhaseStatus(p: Phase): PhaseStatus {
  let total = 0;
  let mastered = 0;
  let practiced = 0;
  let sumN = 0;
  let sumCorrect = 0;
  let sumMs = 0;
  const cells = getCellStats();
  if (p.kind === 'note') {
    for (const s of p.strings) {
      for (let f = p.fretRange[0]; f <= p.fretRange[1]; f++) {
        if (p.notes && !p.notes.includes(getNoteAt(s, f, 'sharp'))) continue;
        total++;
        const st = cells[cellKey('position-to-note', s, f)];
        if (!st || st.n === 0) continue;
        practiced++;
        sumN += st.n;
        sumCorrect += st.correct;
        sumMs += st.sumMs;
        if (st.n >= MIN_N && st.correct / st.n >= p.targetAcc && st.sumMs / st.n <= p.targetMs) mastered++;
      }
    }
  }
  return { total, mastered, progress: total > 0 ? mastered / total : 0,
    accuracy: sumN > 0 ? sumCorrect / sumN : 0, avgMs: sumN > 0 ? sumMs / sumN : 0,
    started: practiced > 0, clear: total > 0 && mastered / total >= CLEAR_RATIO };
}
