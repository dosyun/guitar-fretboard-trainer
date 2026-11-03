import type { FretPosition, IntervalName, NoteName } from '../types';
import { getIntervalAt, getNoteAt } from './fretboard';

export type CourseChord = 'C' | 'F' | 'G' | 'Am';
export type CoursePosition = 'low' | 'mid' | 'high' | 'top';
export type CourseDegree = 'R' | '3' | '5';
export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6;

export interface CourseForm {
  id: string;
  chord: CourseChord;
  pos: CoursePosition;
  strings: [GuitarString, GuitarString, GuitarString];
  frets: [number, number, number];
}

export interface CourseDay {
  day: number;
  topic: string;
  noticing: string;
  prerequisiteLessonIds: string[];
  progression: CourseChord[];
  barsPerChord: number;
  forms: CourseForm[];
}

function form(
  chord: CourseChord,
  pos: CoursePosition,
  frets: CourseForm['frets'],
  strings: CourseForm['strings'] = [3, 2, 1],
): CourseForm {
  return { id: `${chord}-${pos}`, chord, pos, strings, frets };
}

export const COURSE_DAYS: CourseDay[] = [
  {
    day: 1,
    topic: 'C と F を1〜3弦で弾く。',
    noticing: 'どの組でも C の音が同じ場所に残り、2本の指だけが動く（共通音）。',
    prerequisiteLessonIds: ['degree', 'triad'],
    progression: ['C', 'F'],
    barsPerChord: 2,
    forms: [
      form('C', 'low', [0, 1, 0]), form('F', 'low', [2, 1, 1]),
      form('C', 'mid', [5, 5, 3]), form('F', 'mid', [5, 6, 5]),
      form('C', 'high', [9, 8, 8]), form('F', 'high', [10, 10, 8]),
    ],
  },
  {
    day: 2,
    topic: 'C と G を1〜3弦で弾く。',
    noticing: '今度は G の音が残る。C から見て G は5度上、F は5度下で、どちらも C と1音を共有する。',
    prerequisiteLessonIds: ['degree', 'triad'],
    progression: ['C', 'G'],
    barsPerChord: 2,
    forms: [
      form('C', 'mid', [5, 5, 3]), form('G', 'mid', [4, 3, 3]),
      form('C', 'high', [9, 8, 8]), form('G', 'high', [7, 8, 7]),
      form('C', 'top', [12, 13, 12]), form('G', 'top', [12, 12, 10]),
    ],
  },
  {
    day: 3,
    topic: 'C・F・G をつなぐ。',
    noticing: 'ポジションを動かさずに3つのコードが弾ける。',
    prerequisiteLessonIds: ['degree', 'triad'],
    progression: ['C', 'F', 'G', 'C'],
    barsPerChord: 2,
    forms: [
      form('C', 'mid', [5, 5, 3]), form('F', 'mid', [5, 6, 5]),
      form('G', 'mid', [4, 3, 3]), form('C', 'mid', [5, 5, 3]),
    ],
  },
  {
    day: 4,
    topic: 'マイナーを足す。',
    noticing: 'C と Am は2音が同じで、1弦が G から A に上がるだけ。3度が半音下がるとマイナー（Am 5-5-5 の3弦5F＝C が Am の3度）。',
    prerequisiteLessonIds: ['degree', 'triad'],
    progression: ['C', 'Am', 'F', 'G'],
    barsPerChord: 2,
    forms: [
      form('C', 'mid', [5, 5, 3]), form('Am', 'mid', [5, 5, 5]),
      form('F', 'mid', [5, 6, 5]), form('G', 'mid', [4, 3, 3]),
    ],
  },
  {
    day: 5,
    topic: '2〜4弦へ移す。',
    noticing: '同じ考え方が弦をずらしても使える。2弦をまたぐと形が1フレットずれる（3弦と2弦の間だけ長3度）。',
    prerequisiteLessonIds: ['degree', 'triad'],
    progression: ['C', 'F'],
    barsPerChord: 2,
    forms: [
      form('C', 'low', [2, 0, 1], [4, 3, 2]), form('F', 'low', [3, 2, 1], [4, 3, 2]),
      form('C', 'mid', [5, 5, 5], [4, 3, 2]), form('F', 'mid', [7, 5, 6], [4, 3, 2]),
      form('C', 'high', [10, 9, 8], [4, 3, 2]), form('F', 'high', [10, 10, 10], [4, 3, 2]),
    ],
  },
];

const ROOTS: Record<CourseChord, NoteName> = { C: 'C', F: 'F', G: 'G', Am: 'A' };
const DEGREES: CourseDegree[] = ['R', '3', '5'];

function intervalFor(chord: CourseChord, degree: CourseDegree): IntervalName {
  return degree === 'R' ? 'R' : degree === '5' ? 'P5' : chord === 'Am' ? 'm3' : 'M3';
}

export function guitarStringToIndex(n: GuitarString): number {
  return 6 - n;
}

export function formPositions(value: CourseForm): FretPosition[] {
  return value.strings.map((n, i) => ({ string: guitarStringToIndex(n), fret: value.frets[i] }));
}

export interface CourseFormNote extends FretPosition {
  note: NoteName;
  degree: CourseDegree;
}

export function formNotes(value: CourseForm): CourseFormNote[] {
  return formPositions(value).map((position) => {
    const interval = getIntervalAt(position.string, position.fret, ROOTS[value.chord]);
    const degree = DEGREES.find((d) => intervalFor(value.chord, d) === interval);
    if (!degree) throw new Error(`Invalid triad form: ${value.id}`);
    return { ...position, note: getNoteAt(position.string, position.fret) as NoteName, degree };
  });
}

export interface CourseQuestion {
  chord: CourseChord;
  root: NoteName;
  degree: CourseDegree;
  interval: IntervalName;
  strings: number[];
  fretRange: [number, number];
  pos: CoursePosition;
  courseKey: string;
}

export function generateQuestions(
  day: number,
  count = 10,
  opts: { recent?: string[]; rng?: () => number } = {},
): CourseQuestion[] {
  const course = COURSE_DAYS.find((entry) => entry.day === day);
  if (!course) throw new RangeError('Course day must be between 1 and 5');
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Count must be a non-negative integer');
  const candidates = new Map<string, CourseQuestion>();
  for (const value of course.forms) {
    for (const degree of DEGREES) {
      const courseKey = `d${day}:${value.chord}:${value.pos}:${degree}`;
      candidates.set(courseKey, {
        chord: value.chord,
        root: ROOTS[value.chord],
        degree,
        interval: intervalFor(value.chord, degree),
        strings: value.strings.map(guitarStringToIndex),
        fretRange: [Math.min(...value.frets), Math.max(...value.frets)],
        pos: value.pos,
        courseKey,
      });
    }
  }
  const all = [...candidates.values()];
  const external = new Set(opts.recent ?? []);
  const recent: string[] = [];
  const questions: CourseQuestion[] = [];
  const rng = opts.rng ?? Math.random;
  for (let i = 0; i < count; i++) {
    const fresh = all.filter((q) => !recent.includes(q.courseKey));
    const preferred = fresh.filter((q) => !external.has(q.courseKey));
    const pool = preferred.length ? preferred : fresh;
    const question = pool[Math.floor(rng() * pool.length)];
    questions.push({ ...question, strings: [...question.strings], fretRange: [...question.fretRange] });
    recent.push(question.courseKey);
    if (recent.length > 3) recent.shift();
  }
  return questions;
}

export function judgeCourseAnswer(question: CourseQuestion, answer: FretPosition): boolean {
  return Number.isInteger(answer.string) && Number.isInteger(answer.fret)
    && question.strings.includes(answer.string)
    && answer.fret >= question.fretRange[0] && answer.fret <= question.fretRange[1]
    && getIntervalAt(answer.string, answer.fret, question.root) === intervalFor(question.chord, question.degree);
}
