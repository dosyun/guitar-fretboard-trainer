import { useState, useCallback, useRef } from 'react';
import type { CagedFormName, CagedQuizMode, NoteName, FretPosition, Feedback } from '../types';
import { getCagedPositions, getCagedChordTones, CAGED_ORDER } from '../data/caged';

const FEEDBACK_DELAY = 1000;

interface UseCagedQuizOptions {
  rootNote: NoteName;
  maxFret: number;
  onCorrect: () => void;
  onWrong: () => void;
}

export interface CagedQuizState {
  mode: CagedQuizMode;
  targetForm: CagedFormName;
  highlightedPositions: FretPosition[];
  currentPosition: FretPosition | null; // identify-chord-tone用
  feedback: Feedback;
  correctAnswer: string | null;
}

function randomForm(): CagedFormName {
  return CAGED_ORDER[Math.floor(Math.random() * 5)];
}

function generateQuestion(
  mode: CagedQuizMode,
  rootNote: NoteName,
  maxFret: number,
): CagedQuizState {
  const form = randomForm();

  if (mode === 'identify-form') {
    const positions = getCagedPositions(form, rootNote, maxFret);
    return {
      mode,
      targetForm: form,
      highlightedPositions: positions.map((p) => p.pos),
      currentPosition: null,
      feedback: null,
      correctAnswer: null,
    };
  }

  if (mode === 'place-positions') {
    return {
      mode,
      targetForm: form,
      highlightedPositions: [],
      currentPosition: null,
      feedback: null,
      correctAnswer: null,
    };
  }

  // identify-chord-tone
  const chordTones = getCagedChordTones(form, rootNote, maxFret);
  if (chordTones.length === 0) {
    // fallback
    return generateQuestion('identify-form', rootNote, maxFret);
  }
  const allPositions = getCagedPositions(form, rootNote, maxFret);
  const target = chordTones[Math.floor(Math.random() * chordTones.length)];
  return {
    mode,
    targetForm: form,
    highlightedPositions: allPositions.map((p) => p.pos),
    currentPosition: target.pos,
    feedback: null,
    correctAnswer: null,
  };
}

export function useCagedQuiz({ rootNote, maxFret, onCorrect, onWrong }: UseCagedQuizOptions) {
  const [quiz, setQuiz] = useState<CagedQuizState>(() =>
    generateQuestion('identify-form', rootNote, maxFret)
  );
  const [started, setStarted] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nextQuestion = useCallback(() => {
    setQuiz(generateQuestion(quiz.mode, rootNote, maxFret));
  }, [quiz.mode, rootNote, maxFret]);

  const start = useCallback((mode: CagedQuizMode) => {
    setStarted(true);
    setQuiz(generateQuestion(mode, rootNote, maxFret));
  }, [rootNote, maxFret]);

  const answerForm = useCallback((selected: CagedFormName) => {
    if (quiz.feedback) return;
    const isCorrect = selected === quiz.targetForm;
    if (isCorrect) onCorrect(); else onWrong();

    setQuiz((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      correctAnswer: isCorrect ? null : quiz.targetForm,
    }));

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
  }, [quiz.feedback, quiz.targetForm, onCorrect, onWrong, nextQuestion]);

  const answerChordTone = useCallback((selected: string) => {
    if (quiz.feedback || !quiz.currentPosition) return;
    const chordTones = getCagedChordTones(quiz.targetForm, rootNote, maxFret);
    const target = chordTones.find(
      (ct) => ct.pos.string === quiz.currentPosition!.string && ct.pos.fret === quiz.currentPosition!.fret
    );
    const correct = target?.chordTone || 'R';
    const isCorrect = selected === correct;
    if (isCorrect) onCorrect(); else onWrong();

    setQuiz((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      correctAnswer: isCorrect ? null : correct,
    }));

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
  }, [quiz.feedback, quiz.currentPosition, quiz.targetForm, rootNote, maxFret, onCorrect, onWrong, nextQuestion]);

  const answerPosition = useCallback((pos: FretPosition) => {
    if (quiz.feedback) return;
    const correctPositions = getCagedChordTones(quiz.targetForm, rootNote, maxFret);
    const isCorrect = correctPositions.some(
      (p) => p.pos.string === pos.string && p.pos.fret === pos.fret
    );
    if (isCorrect) onCorrect(); else onWrong();

    setQuiz((prev) => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      highlightedPositions: isCorrect ? prev.highlightedPositions : correctPositions.map((p) => p.pos),
    }));

    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => nextQuestion(), FEEDBACK_DELAY);
  }, [quiz.feedback, quiz.targetForm, rootNote, maxFret, onCorrect, onWrong, nextQuestion]);

  const setMode = useCallback((mode: CagedQuizMode) => {
    start(mode);
  }, [start]);

  return {
    quiz,
    started,
    start,
    setMode,
    answerForm,
    answerChordTone,
    answerPosition,
  };
}
