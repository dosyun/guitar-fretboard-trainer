/**
 * Mastery Score（習熟度 0-100） — ChatGPT v0.2提案。
 *
 * masteryScore = accuracy*0.50 + speed*0.35 + recency*0.05 + confidence*0.10
 * （提案の consistency は分散データを持たないため、回数による confidence で代替）
 */
import { getNoteRecognitionMetrics } from './practiceStore';
import { getNoteAt } from './fretboard';
import type { Accidental } from '../types';
import type { CellMetrics } from '../types/practice';

const FAST_MS = 1200;
const SLOW_MS = 4000;
const DAY_MS = 86_400_000;
const c01 = (x: number) => Math.min(1, Math.max(0, x));

/** 1セルの習熟度 0-100 */
export function cellMastery(m: CellMetrics, now: number): number {
  const accuracy = 1 - m.errorRate;
  const speed = 1 - c01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));
  const recency = c01(1 - (now - m.lastAt) / (30 * DAY_MS));
  const confidence = c01(m.n / 10);
  return Math.round(100 * (accuracy * 0.5 + speed * 0.35 + recency * 0.05 + confidence * 0.1));
}

export interface MasterySummary {
  overall: number; // 0-100（盤面全セル平均、未出題=0）
  practiced: number; // 出題済みセル数
  total: number; // 盤面セル数
  top?: { note: string; mastery: number }; // 一番得意な音(n>=2)
  weak?: { note: string; mastery: number }; // 一番苦手な音(n>=2)
}

export function getMasterySummary(maxFret: number, accidental: Accidental): MasterySummary {
  const now = Date.now();
  const metrics = getNoteRecognitionMetrics();
  const total = 6 * (maxFret + 1);

  let sum = 0;
  const byNote = new Map<string, { sum: number; n: number }>();
  for (const m of metrics) {
    const mast = cellMastery(m, now);
    sum += mast; // 未出題セルは metrics に無い = 0 として総和に寄与
    if (m.n >= 2) {
      const note = getNoteAt(m.pos.string, m.pos.fret, accidental);
      const cur = byNote.get(note) ?? { sum: 0, n: 0 };
      byNote.set(note, { sum: cur.sum + mast, n: cur.n + 1 });
    }
  }

  const noteList = [...byNote.entries()]
    .map(([note, v]) => ({ note, mastery: Math.round(v.sum / v.n) }))
    .sort((a, b) => b.mastery - a.mastery);

  return {
    overall: total > 0 ? Math.round(sum / total) : 0,
    practiced: metrics.length,
    total,
    top: noteList[0],
    weak: noteList.length > 1 ? noteList[noteList.length - 1] : undefined,
  };
}
