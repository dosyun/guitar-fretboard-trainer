import { useState, useCallback, useRef } from 'react';
import type { NoteName, FretPosition, Feedback } from '../types';
import type { ScaleName } from '../data/scales';
import { getRandomScalePosition, isInScale, SCALES } from '../data/scales';

const FEEDBACK_DELAY = 800;

export type ScaleQuizMode = 'in-or-out' | 'identify-degree';

interface UseScaleQuizOptions {
  rootNote: NoteName;
  scaleName: ScaleName;
  maxFret: number;
  boxFretRange?: [number, number];
  onCorrect: () => void;
  onWrong: () => void;
}

export interface ScaleQuizState {
  mode: ScaleQuizMode;
  currentPosition: FretPosition | null;
  currentDegree: string | null; // 正解の度数
  feedback: Feedback;
  correctAnswer: string | null;
}

function generateQuestion(
  mode: ScaleQuizMode,
  rootNote: NoteName,
  scaleName: ScaleName,
  maxFret: number,
  boxFretRange?: [number, number],
): ScaleQuizState {
  if (mode === 'in-or-out') {
    // 50%の確率でスケール内/外の音を出題
    const inScale = Math.random() > 0.3; // スケール内を多めに
    if (inScale) {
      const result = getRandomScalePosition(scaleName, rootNote, maxFret, boxFretRange);
      if (result) {
        return {
          mode,
          currentPosition: result.pos,
          currentDegree: result.degree,
          feedback: null,
          correctAnswer: null,
        };
      }
    }
    // スケール外の音を生成
    const minFret = boxFretRange ? boxFretRange[0] : 0;
    const maxF = boxFretRange ? boxFretRange[1] : maxFret;
    for (let attempt = 0; attempt < 50; attempt++) {
      const s = Math.floor(Math.random() * 6);
      const f = minFret + Math.floor(Math.random() * (maxF - minFret + 1));
      const { inScale: isIn } = isInScale(scaleName, rootNote, s, f);
      if (!isIn) {
        return {
          mode,
          currentPosition: { string: s, fret: f },
          currentDegree: null,
          feedback: null,
          correctAnswer: null,
        };
      }
    }
    // fallback: スケール内の音を出す
    const result = getRandomScalePosition(scaleName, rootNote, maxFret, boxFretRange);
    return {
      mode,
      currentPosition: result?.pos ?? { string: 0, fret: 0 },
      currentDegree: result?.degree ?? 'R',
      feedback: null,
      correctAnswer: null,
    };
  }

  // identify-degree
  const result = getRandomScalePosition(scaleName, rootNote, maxFret, boxFretRange);
  return {
    mode,
    currentPosition: result?.pos ?? { string: 0, fret: 0 },
    currentDegree: result?.degree ?? 'R',
    feedback: null,
    correctAnswer: null,
  };
}

export function useScaleQuiz({
  rootNote, scaleName, maxFret, boxFretRange, onCorrect, onWrong,
}: UseScaleQuizOptions) {
  const [quiz, setQuiz] = useState<ScaleQuizState>(() =>
    generateQuestion('in-or-out', rootNote, scaleName, maxFret, boxFretRange)
  );
  const [started, setStarted] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nextQuestion = useCallback(() => {
    setQuiz(generateQuestion(quiz.mode, rootNote, scaleName, maxFret, boxFretRange));
  }, [quiz.mode, rootNote, scaleName, maxFret, boxFretRange]);

  const start = useCallback((mode: ScaleQuizMode) => {
    setStarted(true);
    setQuiz(generateQuestion(mode, rootNote, scaleName, maxFret, boxFretRange));
  }, [rootNote, scaleName, maxFret, boxFretRange]);

  const answerInOrOut = useCallback((answer: 'in' | 'out') => {
    if (quiz.feedback) return;
    const correct = quiz.currentDegree !== null ? 'in' : 'out';
    const isCorrect = answer === correct;
    if (isCorrect) onCorrect(); else onWrong();

    setQuiz((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      correctAnswer: isCorrect ? null : (correct === 'in' ? `スケール内 (${prev.currentDegree})` : 'スケール外'),
    }));

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
  }, [quiz.feedback, quiz.currentDegree, onCorrect, onWrong, nextQuestion]);

  const answerDegree = useCallback((answer: string) => {
    if (quiz.feedback || !quiz.currentDegree) return;
    const isCorrect = answer === quiz.currentDegree;
    if (isCorrect) onCorrect(); else onWrong();

    setQuiz((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      correctAnswer: isCorrect ? null : prev.currentDegree,
    }));

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
  }, [quiz.feedback, quiz.currentDegree, onCorrect, onWrong, nextQuestion]);

  const setMode = useCallback((mode: ScaleQuizMode) => {
    start(mode);
  }, [start]);

  const degreeLabels = SCALES[scaleName].degreeLabels;

  return { quiz, started, start, setMode, answerInOrOut, answerDegree, degreeLabels };
}
