import { useState, useCallback } from 'react';
import type { ScoreState } from '../types';

const STORAGE_KEY = 'guitar-fret-best-streak';

function loadBestStreak(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function useScore() {
  const [score, setScore] = useState<ScoreState>({
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: loadBestStreak(),
  });

  const recordCorrect = useCallback(() => {
    setScore((prev) => {
      const newStreak = prev.streak + 1;
      const newBest = Math.max(prev.bestStreak, newStreak);
      try {
        localStorage.setItem(STORAGE_KEY, String(newBest));
      } catch { /* ignore */ }
      return {
        correct: prev.correct + 1,
        total: prev.total + 1,
        streak: newStreak,
        bestStreak: newBest,
      };
    });
  }, []);

  const recordWrong = useCallback(() => {
    setScore((prev) => ({
      ...prev,
      total: prev.total + 1,
      streak: 0,
    }));
  }, []);

  const resetScore = useCallback(() => {
    setScore((prev) => ({
      correct: 0,
      total: 0,
      streak: 0,
      bestStreak: prev.bestStreak,
    }));
  }, []);

  return { score, recordCorrect, recordWrong, resetScore };
}
