import { useState, useCallback, useRef } from 'react';
import type { QuizMode, QuizState, FretPosition, NoteName, IntervalName, Accidental } from '../types';
import type { AttemptInput } from '../types/practice';
import {
  getNoteAt,
  getIntervalAt,
  getAllPositionsForNote,
  getRandomPosition,
  getRandomNote,
} from '../data/fretboard';
import { pickWeightedPosition, pickWeightedIntervalPosition } from '../data/practiceStore';

const FEEDBACK_DELAY = 800;

interface UseQuizOptions {
  maxFret: number;
  accidental: Accidental;
  strings: number[];
  fretRange: [number, number];
  noteFilter: string[] | null;
  onCorrect: () => void;
  onWrong: () => void;
  onAttempt?: (input: AttemptInput) => void;
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
    // 弱点優先で出題。位置→音名はセル、度数はルートからの度数で重み付け。
    const pos =
      (mode === 'position-to-note'
        ? pickWeightedPosition('position-to-note', strings, fretRange, noteFilter, accidental)
        : pickWeightedIntervalPosition(rootNote, strings, fretRange, noteFilter, accidental)) ??
      getRandomPosition(maxFret, strings, fretRange, noteFilter, accidental);
    return {
      mode,
      currentPosition: pos,
      currentNote: null,
      rootNote,
      feedback: null,
      correctAnswer: null,
    };
  }
  // note-to-position: 弱点セルを選び、その音名を出題（回答は任意の正解位置でOK）
  const weakPos = pickWeightedPosition('note-to-position', strings, fretRange, noteFilter, accidental);
  const note = weakPos
    ? getNoteAt(weakPos.string, weakPos.fret, accidental)
    : getRandomNote(accidental, strings, fretRange, maxFret, noteFilter);
  return {
    mode,
    currentPosition: null,
    currentNote: note,
    rootNote,
    feedback: null,
    correctAnswer: null,
  };
}

export function useQuiz({ maxFret, accidental, strings, fretRange, noteFilter, onCorrect, onWrong, onAttempt }: UseQuizOptions) {
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
  // 出題が提示された時刻。回答時間 = answer時刻 - これ。
  const questionShownAt = useRef<number>(Date.now());

  const nextQuestion = useCallback(
    (mode?: QuizMode, rootNote?: NoteName) => {
      const m = mode ?? quiz.mode;
      const r = rootNote ?? quiz.rootNote;
      setShowHint(false);
      setQuiz(generateQuestion(m, r, maxFret, accidental, strings, fretRange, noteFilter));
      questionShownAt.current = Date.now();
    },
    [quiz.mode, quiz.rootNote, maxFret, accidental, strings, fretRange, noteFilter]
  );

  const start = useCallback(
    (
      mode: QuizMode,
      rootNote: NoteName = 'C',
      scope?: { strings: number[]; fretRange: [number, number]; noteFilter: string[] | null },
    ) => {
      setStarted(true);
      setShowHint(false);
      // scope を渡すと初回出題はその範囲で生成（state更新前のstale回避）。
      const ss = scope ? scope.strings : strings;
      const fr = scope ? scope.fretRange : fretRange;
      const nf = scope ? scope.noteFilter : noteFilter;
      setQuiz(generateQuestion(mode, rootNote, maxFret, accidental, ss, fr, nf));
      questionShownAt.current = Date.now();
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

      onAttempt?.({
        quizType: 'position-to-note',
        isCorrect,
        responseTimeMs: Date.now() - questionShownAt.current,
        string: quiz.currentPosition.string,
        fret: quiz.currentPosition.fret,
        note: correct as NoteName,
      });

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
    [quiz.feedback, quiz.currentPosition, accidental, onCorrect, onWrong, onAttempt, nextQuestion]
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

      onAttempt?.({
        quizType: 'interval',
        isCorrect,
        responseTimeMs: Date.now() - questionShownAt.current,
        string: quiz.currentPosition.string,
        fret: quiz.currentPosition.fret,
        note: getNoteAt(quiz.currentPosition.string, quiz.currentPosition.fret, accidental) as NoteName,
        rootNote: quiz.rootNote,
        degree: correct as IntervalName,
      });

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
    [quiz.feedback, quiz.currentPosition, quiz.rootNote, accidental, onCorrect, onWrong, onAttempt, nextQuestion]
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

      onAttempt?.({
        quizType: 'note-to-position',
        isCorrect,
        responseTimeMs: Date.now() - questionShownAt.current,
        // タップしたセルを対象にする (「このセルを音名Xだと思った」の正誤)
        string: pos.string,
        fret: pos.fret,
        note: quiz.currentNote as NoteName,
      });

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
    [quiz.feedback, quiz.currentNote, maxFret, accidental, onCorrect, onWrong, onAttempt, nextQuestion]
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

  const stop = useCallback(() => {
    clearTimeout(feedbackTimer.current);
    setStarted(false);
    setShowHint(false);
  }, []);

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
    stop,
    answerNote,
    answerInterval,
    answerPosition,
    setMode,
    setRootNote,
    toggleHint,
    correctPositions,
  };
}
