import { useState, useCallback, useRef } from 'react';
import type { QuizMode, QuizState, FretPosition, NoteName, Accidental } from '../types';
import {
  getNoteAt,
  getIntervalAt,
  getAllPositionsForNote,
  getRandomPosition,
  getRandomNote,
} from '../data/fretboard';

const FEEDBACK_DELAY = 800;

interface UseQuizOptions {
  maxFret: number;
  accidental: Accidental;
  strings: number[];
  fretRange: [number, number];
  noteFilter: string[] | null;
  onCorrect: () => void;
  onWrong: () => void;
}

function generateQuestion(
  mode: QuizMode,
  rootNote: NoteName,
  maxFret: number,
  accidental: Accidental,
  strings: number[],
  fretRange: [number, number],
  noteFilter: string[] | null,
): QuizState {
  if (mode === 'position-to-note' || mode === 'interval') {
    const pos = getRandomPosition(maxFret, strings, fretRange, noteFilter, accidental);
    return {
      mode,
      currentPosition: pos,
      currentNote: null,
      rootNote,
      feedback: null,
      correctAnswer: null,
    };
  }
  // note-to-position
  const note = getRandomNote(accidental, strings, fretRange, maxFret, noteFilter);
  return {
    mode,
    currentPosition: null,
    currentNote: note,
    rootNote,
    feedback: null,
    correctAnswer: null,
  };
}

export function useQuiz({ maxFret, accidental, strings, fretRange, noteFilter, onCorrect, onWrong }: UseQuizOptions) {
  const [quiz, setQuiz] = useState<QuizState>({
    mode: 'position-to-note',
    currentPosition: null,
    currentNote: null,
    rootNote: 'C',
    feedback: null,
    correctAnswer: null,
  });

  const [started, setStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nextQuestion = useCallback(
    (mode?: QuizMode, rootNote?: NoteName) => {
      const m = mode ?? quiz.mode;
      const r = rootNote ?? quiz.rootNote;
      setShowHint(false);
      setQuiz(generateQuestion(m, r, maxFret, accidental, strings, fretRange, noteFilter));
    },
    [quiz.mode, quiz.rootNote, maxFret, accidental, strings, fretRange, noteFilter]
  );

  const start = useCallback(
    (mode: QuizMode, rootNote: NoteName = 'C') => {
      setStarted(true);
      setShowHint(false);
      setQuiz(generateQuestion(mode, rootNote, maxFret, accidental, strings, fretRange, noteFilter));
    },
    [maxFret, accidental, strings, fretRange, noteFilter]
  );

  const answerNote = useCallback(
    (selectedNote: string) => {
      if (quiz.feedback || !quiz.currentPosition) return;

      const correct = getNoteAt(
        quiz.currentPosition.string,
        quiz.currentPosition.fret,
        accidental
      );

      const isCorrect = selectedNote === correct;

      if (isCorrect) onCorrect();
      else onWrong();

      setQuiz((prev) => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'wrong',
        correctAnswer: isCorrect ? null : correct,
      }));

      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        nextQuestion();
      }, FEEDBACK_DELAY);
    },
    [quiz.feedback, quiz.currentPosition, accidental, onCorrect, onWrong, nextQuestion]
  );

  const answerInterval = useCallback(
    (selectedInterval: string) => {
      if (quiz.feedback || !quiz.currentPosition) return;

      const correct = getIntervalAt(
        quiz.currentPosition.string,
        quiz.currentPosition.fret,
        quiz.rootNote
      );

      const isCorrect = selectedInterval === correct;

      if (isCorrect) onCorrect();
      else onWrong();

      setQuiz((prev) => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'wrong',
        correctAnswer: isCorrect ? null : correct,
      }));

      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        nextQuestion();
      }, FEEDBACK_DELAY);
    },
    [quiz.feedback, quiz.currentPosition, quiz.rootNote, onCorrect, onWrong, nextQuestion]
  );

  const answerPosition = useCallback(
    (pos: FretPosition) => {
      if (quiz.feedback || !quiz.currentNote) return;

      const correctPositions = getAllPositionsForNote(quiz.currentNote, maxFret, accidental);
      const isCorrect = correctPositions.some(
        (p) => p.string === pos.string && p.fret === pos.fret
      );

      if (isCorrect) onCorrect();
      else onWrong();

      setQuiz((prev) => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'wrong',
        correctAnswer: null,
      }));

      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        nextQuestion();
      }, FEEDBACK_DELAY);
    },
    [quiz.feedback, quiz.currentNote, maxFret, accidental, onCorrect, onWrong, nextQuestion]
  );

  const setMode = useCallback(
    (mode: QuizMode) => {
      start(mode, quiz.rootNote);
    },
    [start, quiz.rootNote]
  );

  const setRootNote = useCallback(
    (root: NoteName) => {
      start(quiz.mode, root);
    },
    [start, quiz.mode]
  );

  const toggleHint = useCallback(() => {
    setShowHint((prev) => !prev);
  }, []);

  // Mode2用: 正解ポジション一覧
  const correctPositions =
    quiz.mode === 'note-to-position' && quiz.currentNote && quiz.feedback === 'wrong'
      ? getAllPositionsForNote(quiz.currentNote, maxFret, accidental)
      : undefined;

  return {
    quiz,
    started,
    showHint,
    start,
    answerNote,
    answerInterval,
    answerPosition,
    setMode,
    setRootNote,
    toggleHint,
    correctPositions,
  };
}
