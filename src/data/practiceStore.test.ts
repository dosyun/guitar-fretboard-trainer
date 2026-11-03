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

describe('コース回答の分離と誤答履歴', () => {
  it('課題キー単位で最新誤答を残し、同時刻は保存順が後の回答を優先する', async () => {
    const { getCourseMisses } = await import('./practiceStore');
    const miss = (id: string, createdAt: number, courseKey: string) =>
      attempt({ id, createdAt, courseKey, quizType: 'course-triad', isCorrect: false, string: 3, fret: 5 });
    recordAttempt(miss('old', 100, 'd1:C:mid:R'));
    recordAttempt(miss('other-key', 200, 'd1:F:mid:5'));
    recordAttempt(miss('new', 300, 'd1:C:mid:R'));
    recordAttempt(miss('tie-later', 300, 'd1:C:mid:R'));
    recordAttempt({ ...miss('correct', 900, 'd1:G:mid:R'), isCorrect: true });
    recordAttempt(attempt({ id: 'basic', createdAt: 1000, quizType: 'position-to-note', isCorrect: false }));
    expect(getCourseMisses(10).map((a) => a.id)).toEqual(['tie-later', 'other-key']);
    expect(getCourseMisses(1).map((a) => a.id)).toEqual(['tie-later']);
    expect(getCourseMisses(0)).toEqual([]);
    expect(getCourseMisses(-1)).toEqual([]);
  });

  it('キーなしは弦・フレット・度数・ルートの組で重複排除する', async () => {
    const { getCourseMisses } = await import('./practiceStore');
    const base = { quizType: 'course-triad' as const, isCorrect: false, string: 3, fret: 5 };
    recordAttempt(attempt({ ...base, id: 'a', createdAt: 100, degree: 'R', rootNote: 'C' }));
    recordAttempt(attempt({ ...base, id: 'b', createdAt: 200, degree: 'R', rootNote: 'C' }));
    recordAttempt(attempt({ ...base, id: 'c', createdAt: 300, degree: 'P5', rootNote: 'C' }));
    recordAttempt(attempt({ ...base, id: 'd', createdAt: 400, degree: 'P5', rootNote: 'F' }));
    // 保存順と時刻順が異なる場合も時刻を優先する。
    recordAttempt(attempt({ ...base, id: 'older-last', createdAt: 50, degree: 'R', rootNote: 'C' }));
    expect(getCourseMisses(10).map((a) => a.id)).toEqual(['d', 'c', 'b']);
  });

  it('コースだけの回答は保存されるが既存の集計を増やさない', async () => {
    const { getAllAttempts, getCourseMisses } = await import('./practiceStore');
    recordAttempt(attempt({
      id: 'course', quizType: 'course-triad', isCorrect: false, degree: 'M3',
      rootNote: 'C', courseKey: 'd1:C:mid:3',
    }));
    expect(getAllAttempts()).toEqual([]);
    expect(getOverallStats()).toEqual({ count: 0, correct: 0, accuracy: 0, avgMs: 0 });
    expect(getNoteRecognitionMetrics()).toEqual([]);
    expect(getDegreeMetrics()).toEqual([]);
    expect(getCourseMisses(5).map((a) => a.id)).toEqual(['course']);
    expect(JSON.parse(localStorage.getItem('gft-attempts-v1')!)).toHaveLength(1);
  });

  it('基本・コードトーンの保存と集計は従来どおり維持する', async () => {
    const { getAllAttempts } = await import('./practiceStore');
    recordAttempt(attempt({
      id: 'note', quizType: 'position-to-note', createdAt: 100, string: 2, fret: 3,
      isCorrect: true, responseTimeMs: 1000,
    }));
    recordAttempt(attempt({
      id: 'interval', quizType: 'interval', createdAt: 200, degree: 'M3',
      isCorrect: false, responseTimeMs: 3000,
    }));
    recordAttempt(attempt({
      id: 'chord', quizType: 'chordtone', degree: 'M3', isCorrect: true, responseTimeMs: 2000,
    }));
    recordAttempt(attempt({
      quizType: 'course-triad', string: 2, fret: 3, degree: 'M3',
      isCorrect: false, responseTimeMs: 9000,
    }));
    expect(getAllAttempts().map((a) => a.id)).toEqual(['note', 'interval', 'chord']);
    expect(getOverallStats()).toEqual({ count: 3, correct: 2, accuracy: 2 / 3, avgMs: 2000 });
    expect(getNoteRecognitionMetrics()).toEqual([
      { pos: { string: 2, fret: 3 }, n: 1, errorRate: 0, avgMs: 1000, lastAt: 100 },
    ]);
    expect(getDegreeMetrics()).toEqual([
      { degree: 'M3', n: 1, errorRate: 1, avgMs: 3000, lastAt: 200 },
    ]);
  });

  it('セッション一覧からもコースを除外する', async () => {
    const { getAllSessions } = await import('./practiceStore');
    const base = { mode: 'free' as const, count: 1, correct: 1, avgMs: 1000, medianMs: 1000, startedAt: 0, endedAt: 1 };
    saveSession({ ...base, id: 'course', quizType: 'course-triad' });
    saveSession({ ...base, id: 'basic', quizType: 'position-to-note' });
    expect(getAllSessions().map((s) => s.id)).toEqual(['basic']);
    expect(JSON.parse(localStorage.getItem('gft-sessions-v1')!)).toHaveLength(2);
  });

  it('基本ログとコースログを合わせた2000件の保存上限を保つ', async () => {
    const { getAllAttempts, getCourseMisses } = await import('./practiceStore');
    localStorage.setItem('gft-attempts-v1', JSON.stringify(Array.from({ length: 2000 }, (_, i) =>
      attempt({ id: `basic-${i}`, quizType: 'position-to-note' }))));
    recordAttempt(attempt({
      id: 'course-last', quizType: 'course-triad', isCorrect: false, courseKey: 'd1:C:mid:R',
    }));
    const raw = JSON.parse(localStorage.getItem('gft-attempts-v1')!);
    expect(raw).toHaveLength(2000);
    expect(raw[0].id).toBe('basic-1');
    expect(raw[1999].id).toBe('course-last');
    expect(getAllAttempts()).toHaveLength(1999);
    expect(getCourseMisses(1)[0].id).toBe('course-last');
  });

  it('練習履歴の削除でコースの進捗も消す', async () => {
    const { clearPracticeData } = await import('./practiceStore');
    localStorage.setItem('gft-course-v1', '{"version":1,"days":{}}');
    recordAttempt(attempt({ quizType: 'course-triad' }));
    clearPracticeData();
    expect(localStorage.getItem('gft-course-v1')).toBeNull();
    expect(localStorage.getItem('gft-attempts-v1')).toBeNull();
  });
});

describe('コース復習の回帰', () => {
  it('各課題の最新回答で復習を判断し、同時刻は保存順を使う', async () => {
    const { getCourseMisses } = await import('./practiceStore');
    const add = (id: string, courseKey: string, createdAt: number, isCorrect: boolean) =>
      recordAttempt(attempt({ id, courseKey, createdAt, isCorrect, quizType: 'course-triad' }));
    add('old-miss', 'learned', 10, false);
    add('correct', 'learned', 20, true);
    add('tie-miss', 'tie', 30, false);
    add('tie-correct', 'tie', 30, true);
    add('old-correct', 'retry', 40, true);
    add('new-miss', 'retry', 50, false);
    add('older-saved-last', 'learned', 5, false);
    expect(getCourseMisses(1).map((value) => value.id)).toEqual(['new-miss']);
    expect(getCourseMisses(10).map((value) => value.id)).toEqual(['new-miss']);
  });

  it.each(['null', '{}', '"bad"', '42', '{broken'])('破損した回答履歴 %s でも記録できる', async (raw) => {
    const { getCourseMisses } = await import('./practiceStore');
    localStorage.setItem('gft-attempts-v1', raw);
    const value = attempt({ id: 'new', quizType: 'course-triad', isCorrect: false, courseKey: 'new' });
    expect(() => recordAttempt(value)).not.toThrow();
    expect(getCourseMisses(5).map((item) => item.id)).toEqual(['new']);
  });

  it('配列のnull・配列・プリミティブを落とし、有効な履歴は残す', async () => {
    const { getCourseMisses } = await import('./practiceStore');
    const old = attempt({ id: 'old', quizType: 'course-triad', isCorrect: false, courseKey: 'old' });
    localStorage.setItem('gft-attempts-v1', JSON.stringify([null, 3, 'bad', [], old]));
    recordAttempt(attempt({ id: 'new', quizType: 'course-triad', isCorrect: false, courseKey: 'new' }));
    expect(getCourseMisses(5).map((item) => item.id)).toEqual(['new', 'old']);
    expect(JSON.parse(localStorage.getItem('gft-attempts-v1')!)).toHaveLength(2);
  });
});
