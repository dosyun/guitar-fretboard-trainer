import type { NoteName, IntervalName, FretPosition } from './index';

/**
 * 練習エンジンのデータモデル (docs/milestone-1-plan.md / docs/adr/0001)
 *
 * quizType はモードごとに固有。度数統計(degreeStats)・前回比(getLastSession)・
 * セッション要約が種目をまたいで混ざらないよう、各クイズが自分の種別で記録する。
 * - position-to-note / note-to-position … 基本の音名認識（ヒートマップ対象）
 * - interval … 基本の度数モード（指板で度数を探す＝degreeStats を駆動）
 * - chordtone/progression/guidetone/keyfunc/ear … 各実戦クイズ（度数統計は汚さない）
 */
export type QuizType =
  | 'position-to-note'
  | 'note-to-position'
  | 'interval'
  | 'chordtone'
  | 'progression'
  | 'guidetone'
  | 'keyfunc'
  | 'ear';

/** 指板ヒートマップの色付け対象になるクイズ種別 (音名認識のみ) */
export const NOTE_RECOGNITION_TYPES: QuizType[] = ['position-to-note', 'note-to-position'];

export function isNoteRecognition(t: QuizType): boolean {
  return NOTE_RECOGNITION_TYPES.includes(t);
}

/** 1問ごとの回答記録 */
export interface PracticeAttempt {
  id: string;
  sessionId: string;
  quizType: QuizType;
  isCorrect: boolean;
  responseTimeMs: number;
  // 出題対象 (target)。音名認識では (string, fret) がヒートマップのセル。
  string: number; // 0-5
  fret: number; // 0-maxFret
  note?: NoteName; // 音名認識: そのセルの音
  wrong?: string; // 誤答時にユーザーが選んだ/触れた音名（混同ペア診断用）
  rootNote?: NoteName; // interval: ルート
  degree?: IntervalName; // interval: 度数
  createdAt: number; // epoch ms
}

/** クイズ側が1問ごとに発行する計測情報 (id/sessionId/createdAt はセッションが付与) */
export interface AttemptInput {
  quizType: QuizType;
  isCorrect: boolean;
  responseTimeMs: number;
  string: number;
  fret: number;
  note?: NoteName;
  wrong?: string;
  rootNote?: NoteName;
  degree?: IntervalName;
}

/** セッション要約 (結果画面・前回比の単位) */
export interface SessionSummary {
  id: string;
  quizType: QuizType;
  mode: 'daily' | 'free';
  count: number;
  correct: number;
  avgMs: number;
  medianMs: number;
  startedAt: number;
  endedAt: number;
}

/**
 * ヒートマップ/弱点用のセル集計。生ログを毎回走査しないために保持する。
 * key = `${quizType}:${string}:${fret}` (cellKey)
 */
export interface CellStat {
  n: number;
  correct: number;
  sumMs: number; // 平均算出用
  lastAt: number;
}

export type CellStatMap = Record<string, CellStat>;

export function cellKey(quizType: QuizType, string: number, fret: number): string {
  return `${quizType}:${string}:${fret}`;
}

export interface CellMetrics {
  pos: FretPosition;
  n: number;
  errorRate: number; // 0-1
  avgMs: number;
  lastAt: number;
}

/**
 * 度数(interval)の弱点集計。ルート依存で指板セルには混ぜないため、
 * 度数そのもの(R, m2, ... M7)を単位にする（[CONTEXT.md] 出題対象）。
 */
export interface DegreeStat {
  n: number;
  correct: number;
  sumMs: number;
  lastAt: number;
}
export type DegreeStatMap = Partial<Record<IntervalName, DegreeStat>>;

export interface DegreeMetrics {
  degree: IntervalName;
  n: number;
  errorRate: number;
  avgMs: number;
  lastAt: number;
}
