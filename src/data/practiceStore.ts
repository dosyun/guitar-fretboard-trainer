/**
 * 練習ログの永続化レイヤ (docs/milestone-1-plan.md)
 *
 * localStorage 実装。API をこのモジュールに閉じ込めることで、
 * 量が増えたら IndexedDB へ差し替え可能にする。
 *
 * 保持するもの:
 *  - 生 PracticeAttempt (履歴用、直近 MAX_ATTEMPTS 件のローリング)
 *  - CellStat 集計 (ヒートマップ/弱点用、音名認識のみ)
 *  - SessionSummary (結果画面/前回比用)
 */
import type {
  PracticeAttempt,
  SessionSummary,
  CellStatMap,
  CellStat,
  QuizType,
  CellMetrics,
} from '../types/practice';
import { cellKey, isNoteRecognition } from '../types/practice';

const ATTEMPTS_KEY = 'gft-attempts-v1';
const CELLS_KEY = 'gft-cellstats-v1';
const SESSIONS_KEY = 'gft-sessions-v1';
const MAX_ATTEMPTS = 2000;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or unavailable — 失敗しても練習は続行 */
  }
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

/** 1問の回答を記録する。音名認識のときだけセル集計を更新する。 */
export function recordAttempt(attempt: PracticeAttempt): void {
  const attempts = load<PracticeAttempt[]>(ATTEMPTS_KEY, []);
  attempts.push(attempt);
  if (attempts.length > MAX_ATTEMPTS) {
    attempts.splice(0, attempts.length - MAX_ATTEMPTS);
  }
  save(ATTEMPTS_KEY, attempts);

  if (isNoteRecognition(attempt.quizType)) {
    const cells = load<CellStatMap>(CELLS_KEY, {});
    const key = cellKey(attempt.quizType, attempt.string, attempt.fret);
    const cur: CellStat = cells[key] ?? { n: 0, correct: 0, sumMs: 0, lastAt: 0 };
    cells[key] = {
      n: cur.n + 1,
      correct: cur.correct + (attempt.isCorrect ? 1 : 0),
      sumMs: cur.sumMs + attempt.responseTimeMs,
      lastAt: attempt.createdAt,
    };
    save(CELLS_KEY, cells);
  }
}

export function getCellStats(): CellStatMap {
  return load<CellStatMap>(CELLS_KEY, {});
}

/**
 * 指板ヒートマップ用のセル指標を返す。
 * 音名認識(position-to-note / note-to-position)を合算した「音名認識全体」の弱点。
 */
export function getNoteRecognitionMetrics(): CellMetrics[] {
  const cells = getCellStats();
  // (string, fret) ごとに position-to-note と note-to-position を合算
  const merged = new Map<string, CellStat>();
  for (const [key, stat] of Object.entries(cells)) {
    const [quizType, s, f] = key.split(':');
    if (!isNoteRecognition(quizType as QuizType)) continue;
    const cellId = `${s}:${f}`;
    const cur = merged.get(cellId) ?? { n: 0, correct: 0, sumMs: 0, lastAt: 0 };
    merged.set(cellId, {
      n: cur.n + stat.n,
      correct: cur.correct + stat.correct,
      sumMs: cur.sumMs + stat.sumMs,
      lastAt: Math.max(cur.lastAt, stat.lastAt),
    });
  }
  const out: CellMetrics[] = [];
  for (const [cellId, stat] of merged) {
    const [s, f] = cellId.split(':').map(Number);
    out.push({
      pos: { string: s, fret: f },
      n: stat.n,
      errorRate: stat.n > 0 ? 1 - stat.correct / stat.n : 0,
      avgMs: stat.n > 0 ? stat.sumMs / stat.n : 0,
      lastAt: stat.lastAt,
    });
  }
  return out;
}

export function saveSession(summary: SessionSummary): void {
  const sessions = load<SessionSummary[]>(SESSIONS_KEY, []);
  sessions.push(summary);
  save(SESSIONS_KEY, sessions);
}

export function getAllSessions(): SessionSummary[] {
  return load<SessionSummary[]>(SESSIONS_KEY, []);
}

/** 指定クイズ種別の「直近の」セッション (前回比の比較対象)。なければ null。 */
export function getLastSession(quizType: QuizType): SessionSummary | null {
  const sessions = getAllSessions().filter((s) => s.quizType === quizType);
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
}

export function getAllAttempts(): PracticeAttempt[] {
  return load<PracticeAttempt[]>(ATTEMPTS_KEY, []);
}

/** すべての練習データを消去する (設定のリセット用)。 */
export function clearPracticeData(): void {
  [ATTEMPTS_KEY, CELLS_KEY, SESSIONS_KEY].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  });
}

/** 配列の中央値 (セッション結果用)。 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
