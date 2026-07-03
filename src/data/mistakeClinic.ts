/**
 * Mistake Clinic: 練習ログから弱点を「言語化」する診断。
 * 「2弦の音名が弱い」「度数mの3を探す問題の正答率が低い」のように、
 * ユーザーが“何が分からないか分からない”状態を、アプリ側が言葉にする。
 */
import { getAllAttempts, getDegreeMetrics } from './practiceStore';
import { getNoteAt, getNoteNames, getNoteIndex } from './fretboard';
import { isNoteRecognition } from '../types/practice';
import type { Accidental } from '../types';

export interface Diagnosis {
  id: string;
  text: string;
  drillNote?: string; // あれば「その音を練習」できる
  drillNotes?: string[]; // 混同ペアなど複数音のドリル
  drillString?: number; // あれば「その弦を練習」できる (0=6弦 .. 5=1弦)
  drillFretRange?: [number, number]; // あれば「そのフレット帯を練習」できる
}

const MIN_N = 4;

interface Acc {
  n: number;
  c: number;
}

function bump(map: Map<string | number, Acc>, key: string | number, correct: boolean) {
  const a = map.get(key) ?? { n: 0, c: 0 };
  a.n += 1;
  if (correct) a.c += 1;
  map.set(key, a);
}

function worst(map: Map<string | number, Acc>): { key: string | number; acc: number } | null {
  let best: { key: string | number; acc: number } | null = null;
  for (const [key, v] of map) {
    if (v.n < MIN_N) continue;
    const acc = v.c / v.n;
    if (!best || acc < best.acc) best = { key, acc };
  }
  return best;
}

const fretBucket = (f: number) => (f <= 4 ? '0–4F' : f <= 9 ? '5–9F' : '10F以上');
// バケット表示 → 実フレット範囲（上限は呼び出し側で maxFret にクランプ）
const BUCKET_RANGE: Record<string, [number, number]> = {
  '0–4F': [0, 4],
  '5–9F': [5, 9],
  '10F以上': [10, 99],
};

/** 弱点診断（最大3件、弱い順）。データが乏しければ空配列。 */
export function diagnose(accidental: Accidental): Diagnosis[] {
  const attempts = getAllAttempts().filter((a) => isNoteRecognition(a.quizType));
  const cand: { d: Diagnosis; sev: number }[] = [];

  // 混同ペア: 誤答時の (正解の音, 選んだ/触れた音) を今の表記に正規化して集計
  const names = getNoteNames(accidental);
  const label = (n: string) => names[getNoteIndex(n)] ?? n;
  const pairs = new Map<string, { a: string; b: string; n: number }>();
  for (const at of attempts) {
    if (at.isCorrect || !at.note || !at.wrong) continue;
    const a = label(at.note);
    const b = label(at.wrong);
    if (a === b) continue;
    const [lo, hi] = [a, b].sort();
    const key = `${lo}|${hi}`;
    const cur = pairs.get(key) ?? { a: lo, b: hi, n: 0 };
    cur.n += 1;
    pairs.set(key, cur);
  }
  const topPair = [...pairs.values()].sort((x, y) => y.n - x.n)[0];
  if (topPair && topPair.n >= 2) {
    cand.push({
      d: {
        id: 'confusion',
        text: `「${topPair.a}」と「${topPair.b}」を混同しやすい（${topPair.n}回）`,
        drillNotes: [topPair.a, topPair.b],
      },
      sev: 1.2 + topPair.n * 0.05, // 最優先で表示
    });
  }

  if (attempts.length >= 8) {
    const byNote = new Map<string | number, Acc>();
    const byString = new Map<string | number, Acc>();
    const byFret = new Map<string | number, Acc>();
    for (const a of attempts) {
      bump(byNote, getNoteAt(a.string, a.fret, accidental), a.isCorrect);
      bump(byString, a.string, a.isCorrect);
      bump(byFret, fretBucket(a.fret), a.isCorrect);
    }

    const wn = worst(byNote);
    if (wn && wn.acc < 0.7) {
      cand.push({
        d: { id: 'note', text: `「${wn.key}」の音名が弱い（正答率 ${Math.round(wn.acc * 100)}%）`, drillNote: String(wn.key) },
        sev: 1 - wn.acc,
      });
    }
    const ws = worst(byString);
    if (ws && ws.acc < 0.7) {
      cand.push({
        d: {
          id: 'string',
          text: `${6 - (ws.key as number)}弦の音名が弱い（正答率 ${Math.round(ws.acc * 100)}%）`,
          drillString: ws.key as number,
        },
        sev: (1 - ws.acc) * 0.9,
      });
    }
    const wf = worst(byFret);
    if (wf && wf.acc < 0.7) {
      cand.push({
        d: {
          id: 'fret',
          text: `${wf.key} の音名が弱い（正答率 ${Math.round(wf.acc * 100)}%）`,
          drillFretRange: BUCKET_RANGE[wf.key as string],
        },
        sev: (1 - wf.acc) * 0.8,
      });
    }
  }

  const deg = getDegreeMetrics()
    .filter((m) => m.n >= MIN_N)
    .sort((a, b) => b.errorRate - a.errorRate)[0];
  if (deg && deg.errorRate > 0.3) {
    cand.push({
      d: { id: 'degree', text: `度数「${deg.degree}」を探す問題の正答率が低い（${Math.round((1 - deg.errorRate) * 100)}%）` },
      sev: deg.errorRate * 0.85,
    });
  }

  return cand.sort((a, b) => b.sev - a.sev).slice(0, 3).map((x) => x.d);
}
