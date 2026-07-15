import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAttempt,
  getDegreeMetrics,
  getNoteRecognitionMetrics,
  saveSession,
  getLastSession,
  getOverallStats,
  median,
} from './practiceStore';
import type { PracticeAttempt, SessionSummary, QuizType } from '../types/practice';

// node 環境には localStorage が無いので、テスト用にメモリ実装を差し込む。
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
});

let seq = 0;
function attempt(over: Partial<PracticeAttempt> & { quizType: QuizType }): PracticeAttempt {
  seq += 1;
  return {
    id: `a${seq}`,
    sessionId: 's1',
    isCorrect: true,
    responseTimeMs: 1000,
    string: 0,
    fret: 0,
    createdAt: 1000 + seq,
    ...over,
  };
}

describe('度数統計の種目分離（クロスコンタミ回帰）', () => {
  it('基本の度数モード(interval)だけが degreeStats を駆動する', () => {
    // 基本の度数モード: M3 を正解
    recordAttempt(attempt({ quizType: 'interval', degree: 'M3', isCorrect: true }));
    // 耳トレ: M3 を誤答（以前はこれが degreeStats を汚染していた）
    recordAttempt(attempt({ quizType: 'ear', degree: 'M3', isCorrect: false }));
    // キー機能: M3 を誤答（同上）
    recordAttempt(attempt({ quizType: 'keyfunc', degree: 'M3', isCorrect: false }));

    const m3 = getDegreeMetrics().find((m) => m.degree === 'M3');
    expect(m3).toBeDefined();
    // interval の1件だけが数えられ、耳トレ/キー機能は混ざらない
    expect(m3!.n).toBe(1);
    expect(m3!.errorRate).toBe(0); // 正解1/1
  });

  it('実戦クイズは指板ヒートマップ(cellstats)も汚さない', () => {
    recordAttempt(attempt({ quizType: 'position-to-note', string: 2, fret: 3, isCorrect: true }));
    recordAttempt(attempt({ quizType: 'chordtone', string: 2, fret: 3, degree: 'M3', isCorrect: false }));

    const cell = getNoteRecognitionMetrics().find((c) => c.pos.string === 2 && c.pos.fret === 3);
    expect(cell!.n).toBe(1); // 音名認識の1件のみ
  });
});

describe('getLastSession は種目ごとに前回を返す（前回比の汚染回帰）', () => {
  const mk = (quizType: QuizType, id: string, avgMs: number): SessionSummary => ({
    id,
    quizType,
    mode: 'free',
    count: 5,
    correct: 4,
    avgMs,
    medianMs: avgMs,
    startedAt: 0,
    endedAt: 1,
  });

  it('コードトーンの前回比に耳トレが混ざらない', () => {
    saveSession(mk('chordtone', 'c1', 1000));
    saveSession(mk('ear', 'e1', 9999));
    saveSession(mk('chordtone', 'c2', 1200));

    expect(getLastSession('chordtone')!.id).toBe('c2');
    expect(getLastSession('ear')!.id).toBe('e1');
    expect(getLastSession('guidetone')).toBeNull();
  });
});

describe('getOverallStats', () => {
  it('結果画面まで進んでいない回答も累計に含める', () => {
    recordAttempt(attempt({ quizType: 'position-to-note', isCorrect: true, responseTimeMs: 1000 }));
    recordAttempt(attempt({ quizType: 'position-to-note', isCorrect: false, responseTimeMs: 3000 }));

    expect(getOverallStats()).toEqual({
      count: 2,
      correct: 1,
      accuracy: 0.5,
      avgMs: 2000,
    });
  });

  it('セッション要約を保存しても回答を二重計上しない', () => {
    recordAttempt(attempt({ quizType: 'position-to-note', isCorrect: true, responseTimeMs: 1200 }));
    saveSession({
      id: 's1',
      quizType: 'position-to-note',
      mode: 'free',
      count: 1,
      correct: 1,
      avgMs: 1200,
      medianMs: 1200,
      startedAt: 0,
      endedAt: 1,
    });

    expect(getOverallStats().count).toBe(1);
  });
});

describe('median', () => {
  it('奇数・偶数個の中央値', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(3); // (2+3)/2=2.5→四捨五入3
    expect(median([])).toBe(0);
  });
});
