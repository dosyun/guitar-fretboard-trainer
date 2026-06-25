import { useState, useCallback, useRef } from 'react';
import type { AttemptInput, SessionSummary, PracticeAttempt } from '../types/practice';
import { recordAttempt, saveSession, newId, median } from '../data/practiceStore';

export type SessionMode = 'daily' | 'free';

/**
 * 練習セッションのライフサイクル管理 (docs/milestone-1-plan.md / docs/adr/0001)
 *
 * - startSession(): 新しいセッションを開始
 * - record(): 1問の計測を永続化しつつセッションに積む (セッション未開始なら自動開始)
 * - finalize(): SessionSummary を算出・保存して返す
 */
export function useSession() {
  const sessionRef = useRef<{ id: string; mode: SessionMode; startedAt: number } | null>(null);
  const attemptsRef = useRef<PracticeAttempt[]>([]);
  const [count, setCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [active, setActive] = useState(false);

  const startSession = useCallback((mode: SessionMode = 'free') => {
    sessionRef.current = { id: newId(), mode, startedAt: Date.now() };
    attemptsRef.current = [];
    setCount(0);
    setCorrect(0);
    setActive(true);
  }, []);

  const record = useCallback((input: AttemptInput) => {
    if (!sessionRef.current) {
      sessionRef.current = { id: newId(), mode: 'free', startedAt: Date.now() };
      attemptsRef.current = [];
      setActive(true);
    }
    const attempt: PracticeAttempt = {
      ...input,
      id: newId(),
      sessionId: sessionRef.current.id,
      createdAt: Date.now(),
    };
    recordAttempt(attempt);
    attemptsRef.current.push(attempt);
    setCount((c) => c + 1);
    if (input.isCorrect) setCorrect((c) => c + 1);
  }, []);

  /** セッションを締めて要約を返す。1問も無ければ null。 */
  const finalize = useCallback((): SessionSummary | null => {
    const s = sessionRef.current;
    const attempts = attemptsRef.current;
    sessionRef.current = null;
    setActive(false);
    if (!s || attempts.length === 0) return null;

    const times = attempts.map((a) => a.responseTimeMs);
    const summary: SessionSummary = {
      id: s.id,
      quizType: attempts[attempts.length - 1].quizType,
      mode: s.mode,
      count: attempts.length,
      correct: attempts.filter((a) => a.isCorrect).length,
      avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      medianMs: median(times),
      startedAt: s.startedAt,
      endedAt: Date.now(),
    };
    saveSession(summary);
    return summary;
  }, []);

  /** 結果を残さず破棄する (モード切替などで仕切り直すとき)。 */
  const discard = useCallback(() => {
    sessionRef.current = null;
    attemptsRef.current = [];
    setCount(0);
    setCorrect(0);
    setActive(false);
  }, []);

  return { startSession, record, finalize, discard, count, correct, active };
}
