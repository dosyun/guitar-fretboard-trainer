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
import { getNoteAt } from './fretboard';
import type { FretPosition, Accidental } from '../types';

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

// ===== 連続練習日数 (streak) =====

const STREAK_KEY = 'gft-streak-v1';
interface StreakData { lastDay: string; streak: number }

function dayKey(offsetDays = 0): string {
  const d = new Date(Date.now() - offsetDays * DAY_MS);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 今日の練習完了を記録し、更新後の連続日数を返す。同日2回目以降は据え置き。 */
export function recordPracticeDay(): number {
  const today = dayKey(0);
  const data = load<StreakData>(STREAK_KEY, { lastDay: '', streak: 0 });
  if (data.lastDay === today) return data.streak;
  const streak = data.lastDay === dayKey(1) ? data.streak + 1 : 1;
  save(STREAK_KEY, { lastDay: today, streak });
  return streak;
}

/** 現在の連続練習日数。最終練習が今日/昨日でなければ途切れて0。 */
export function getStreak(): number {
  const data = load<StreakData>(STREAK_KEY, { lastDay: '', streak: 0 });
  if (!data.lastDay) return 0;
  return data.lastDay === dayKey(0) || data.lastDay === dayKey(1) ? data.streak : 0;
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

// ===== 弱点自動出題 (docs/adr/0002, ChatGPT提案3位) =====

const SEL_FAST_MS = 1200;
const SEL_SLOW_MS = 4000;
const DAY_MS = 86_400_000;
const clampU = (x: number) => Math.min(1, Math.max(0, x));

/**
 * 弱点スコア = 誤答率0.45 + 反応の遅さ0.35 + 経過(staleness)0.15。
 * (importance 0.05 は将来。現状は重要度重みなし)
 */
function statWeakness(stat: CellStat, now: number): number {
  const errorRate = 1 - stat.correct / stat.n;
  const norm = clampU((stat.sumMs / stat.n - SEL_FAST_MS) / (SEL_SLOW_MS - SEL_FAST_MS));
  const staleness = clampU((now - stat.lastAt) / (14 * DAY_MS));
  return errorRate * 0.45 + norm * 0.35 + staleness * 0.15;
}

/**
 * 弱点重み付きで出題対象セルを選ぶ。配分: 弱点60% / 通常復習30% / 新規10%。
 * 範囲内に記録が無ければ null（呼び出し側で一様ランダムにフォールバック）。
 */
export function pickWeightedPosition(
  quizType: QuizType,
  strings: number[],
  fretRange: [number, number],
  noteFilter: string[] | null,
  accidental: Accidental,
): FretPosition | null {
  const ss = strings.length ? strings : [0, 1, 2, 3, 4, 5];
  const [lo, hi] = fretRange;
  const candidates: FretPosition[] = [];
  for (const s of ss) {
    for (let f = lo; f <= hi; f++) {
      if (noteFilter && noteFilter.length && !noteFilter.includes(getNoteAt(s, f, accidental))) continue;
      candidates.push({ string: s, fret: f });
    }
  }
  if (candidates.length === 0) return null;

  const cells = getCellStats();
  const now = Date.now();
  const tested: { pos: FretPosition; w: number }[] = [];
  const untested: FretPosition[] = [];
  for (const c of candidates) {
    const stat = cells[cellKey(quizType, c.string, c.fret)];
    if (stat && stat.n > 0) tested.push({ pos: c, w: statWeakness(stat, now) });
    else untested.push(c);
  }
  // 記録ゼロなら適応しない（呼び出し側で一様 random）
  if (tested.length === 0) return null;

  const uniform = (arr: FretPosition[]) => arr[Math.floor(Math.random() * arr.length)];
  const roll = Math.random();

  // 弱点 60%: 弱点スコアで重み付き抽選（弱いほど出やすい）
  if (roll < 0.6) {
    const total = tested.reduce((a, t) => a + (t.w + 0.05), 0);
    let r = Math.random() * total;
    for (const t of tested) {
      r -= t.w + 0.05;
      if (r <= 0) return t.pos;
    }
    return tested[tested.length - 1].pos;
  }
  // 通常復習 30%: 既習から一様
  if (roll < 0.9) return uniform(tested.map((t) => t.pos));
  // 新規 10%: 未出題から一様（無ければ既習）
  return untested.length ? uniform(untested) : uniform(tested.map((t) => t.pos));
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
