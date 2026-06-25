/**
 * フェーズ到達マップ (docs/adr/0002 ソフトガイド)
 *
 * フェーズ = 練習範囲のプリセット＋到達目標。ロックはしない（いつでも飛べる）。
 * フェーズ内で「次にどの問題を出すか」は弱点エンジン(pickWeighted*)が決める。
 * クリア判定・進捗は記録から導出（永続化しない）。
 */
import { getCellStats, getDegreeMetrics } from './practiceStore';
import { getNoteAt, INTERVAL_NAMES } from './fretboard';
import { cellKey } from '../types/practice';
import type { QuizMode } from '../types';

const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ALL_STRINGS = [0, 1, 2, 3, 4, 5];
/** 1セルを「習得」とみなす最小試行回数 */
const MIN_N = 3;
/** フェーズクリアに必要な習得率 */
const CLEAR_RATIO = 0.9;

export interface Phase {
  id: string;
  title: string;
  scope: string; // 人間向けの範囲説明
  mode: QuizMode;
  strings: number[];
  fretRange: [number, number];
  notes: string[] | null; // null = 全音
  targetAcc: number; // 0-1
  targetMs: number;
}

export const PHASES: Phase[] = [
  {
    id: 'low-naturals',
    title: '低音弦のナチュラル音',
    scope: '6・5弦 / 0-12F / ナチュラル',
    mode: 'position-to-note',
    strings: [0, 1],
    fretRange: [0, 12],
    notes: NATURALS,
    targetAcc: 0.9,
    targetMs: 2500,
  },
  {
    id: 'low-frets-naturals',
    title: '全弦・低フレットのナチュラル音',
    scope: '全弦 / 0-5F / ナチュラル',
    mode: 'position-to-note',
    strings: ALL_STRINGS,
    fretRange: [0, 5],
    notes: NATURALS,
    targetAcc: 0.9,
    targetMs: 2500,
  },
  {
    id: 'all-naturals',
    title: '指板全体のナチュラル音',
    scope: '全弦 / 0-12F / ナチュラル',
    mode: 'position-to-note',
    strings: ALL_STRINGS,
    fretRange: [0, 12],
    notes: NATURALS,
    targetAcc: 0.9,
    targetMs: 2000,
  },
  {
    id: 'all-notes',
    title: 'シャープ/フラット含む全音',
    scope: '全弦 / 0-12F / 全音',
    mode: 'position-to-note',
    strings: ALL_STRINGS,
    fretRange: [0, 12],
    notes: null,
    targetAcc: 0.88,
    targetMs: 2200,
  },
  {
    id: 'degrees',
    title: 'ルートからの度数',
    scope: '度数モード / 全弦 / 0-12F',
    mode: 'interval',
    strings: ALL_STRINGS,
    fretRange: [0, 12],
    notes: null,
    targetAcc: 0.85,
    targetMs: 2500,
  },
];

export interface PhaseStatus {
  total: number;
  mastered: number;
  progress: number; // 0-1 (mastered/total)
  accuracy: number; // 0-1 (出題済みの加重平均)
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

  if (p.mode === 'interval') {
    const byDeg = new Map(getDegreeMetrics().map((m) => [m.degree, m]));
    total = INTERVAL_NAMES.length;
    for (const deg of INTERVAL_NAMES) {
      const m = byDeg.get(deg);
      if (!m || m.n === 0) continue;
      practiced++;
      sumN += m.n;
      sumCorrect += (1 - m.errorRate) * m.n;
      sumMs += m.avgMs * m.n;
      if (m.n >= MIN_N && 1 - m.errorRate >= p.targetAcc && m.avgMs <= p.targetMs) mastered++;
    }
  } else {
    const cells = getCellStats();
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
        const acc = st.correct / st.n;
        const avg = st.sumMs / st.n;
        if (st.n >= MIN_N && acc >= p.targetAcc && avg <= p.targetMs) mastered++;
      }
    }
  }

  return {
    total,
    mastered,
    progress: total > 0 ? mastered / total : 0,
    accuracy: sumN > 0 ? sumCorrect / sumN : 0,
    avgMs: sumN > 0 ? sumMs / sumN : 0,
    started: practiced > 0,
    clear: total > 0 && mastered / total >= CLEAR_RATIO,
  };
}
