import type { QuizMode, NoteName, IntervalName, FretPosition } from './index';

/**
 * 練習エンジンのデータモデル (docs/milestone-1-plan.md / docs/adr/0001)
 *
 * 第一弾は既存3クイズ (QuizMode) のみ計測する。
 */
export type QuizType = QuizMode; // 'position-to-note' | 'note-to-position' | 'interval'

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
