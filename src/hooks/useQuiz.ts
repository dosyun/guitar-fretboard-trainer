import { useState, useCallback, useRef, useEffect } from 'react';
import type { QuizMode, QuizState, FretPosition, NoteName, IntervalName, Accidental } from '../types';
import type { AttemptInput } from '../types/practice';
import {
  getNoteAt,
  getIntervalAt,
  getAllPositionsForNote,
  getRandomPosition,
  getRandomNote,
  sameNote,
} from '../data/fretboard';
import { pickWeightedPosition, pickWeightedIntervalPosition } from '../data/practiceStore';
import { isManualTempo } from '../data/tempo';
import type { Phase } from '../data/phases';
import { generateDegreeQuestion } from '../data/stageTutorial';

// 正解=素早く次へ。誤答=正解や「なぜ」を読む時間を確保して長めに。
const CORRECT_DELAY = 800;
const CORRECT_DELAY_INTERVAL = 1300;
const WRONG_DELAY = 2800;

interface UseQuizOptions {
  maxFret: number;
  accidental: Accidental;
  strings: number[];
  fretRange: [number, number];
  noteFilter: string[] | null;
  onCorrect: () => void;
  onWrong: () => void;
  onAttempt?: (input: AttemptInput) => void;
  stage?: Phase;
  questionLimit?: number;
  onRoundComplete?: () => void;
}

function generateQuestion(
  mode: QuizMode,
  rootNote: NoteName,
  maxFret: number,
  accidental: Accidental,
  strings: number[],
  fretRange: [number, number],
  noteFilter: string[] | null,
  adaptive: boolean,
  stage?: Phase,
): QuizState {
  if (stage?.mode === 'interval') {
    const { position, rootPosition } = generateDegreeQuestion(stage);
    return {
      mode: 'interval', currentPosition: position, currentNote: null,
      rootNote: getNoteAt(rootPosition.string, rootPosition.fret, 'sharp') as NoteName,
      rootPosition, feedback: null, correctAnswer: null,
    };
  }
  if (mode === 'position-to-note' || mode === 'interval') {
    // adaptive(=デイリー)は弱点優先。チャレンジは純ランダム。
    const weak = !adaptive
      ? null
      : mode === 'position-to-note'
        ? pickWeightedPosition('position-to-note', strings, fretRange, noteFilter, accidental)
        : pickWeightedIntervalPosition(rootNote, strings, fretRange, noteFilter, accidental);
    const pos = weak ?? getRandomPosition(maxFret, strings, fretRange, noteFilter, accidental);
    return {
      mode,
      currentPosition: pos,
      currentNote: null,
      rootNote,
      feedback: null,
      correctAnswer: null,
    };
  }
  // note-to-position: adaptiveなら弱点セルの音名、そうでなければランダムな音名
  const weakPos = adaptive
    ? pickWeightedPosition('note-to-position', strings, fretRange, noteFilter, accidental)
    : null;
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

/** 重複回避用の問題キー（位置 or 音名）。 */
function keyOf(q: QuizState): string {
  if (q.mode === 'note-to-position') return `n:${q.currentNote}`;
  if (q.rootPosition && q.currentPosition) {
    return `r:${q.rootPosition.string}:${q.rootPosition.fret}:p:${q.currentPosition.string}:${q.currentPosition.fret}`;
  }
  return q.currentPosition ? `p:${q.currentPosition.string}:${q.currentPosition.fret}` : 'x';
}

export function useQuiz({ maxFret, accidental, strings, fretRange, noteFilter, onCorrect, onWrong, onAttempt, stage, questionLimit, onRoundComplete }: UseQuizOptions) {
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
  // 出題が提示された時刻。回答時間 = answer時刻 - これ。start()/nextQuestion() で必ず設定される。
  const questionShownAt = useRef<number>(0);
  // 直近に出した問題のキー（近接の重複を避ける）
  const recentKeys = useRef<string[]>([]);
  // セッションが弱点優先(デイリー)かどうか
  const adaptiveRef = useRef<boolean>(false);
  const activeRef = useRef(false);
  const answeredRef = useRef(false);
  const answerCountRef = useRef(0);
  const roundCompleteRef = useRef(onRoundComplete);

  useEffect(() => { roundCompleteRef.current = onRoundComplete; }, [onRoundComplete]);
  useEffect(() => () => {
    clearTimeout(feedbackTimer.current);
    activeRef.current = false;
  }, []);

  const buildQuestion = useCallback(
    (
      mode: QuizMode,
      rootNote: NoteName,
      scope?: { strings: number[]; fretRange: [number, number]; noteFilter: string[] | null },
    ): QuizState => {
      // scope を渡すと初回出題はその範囲で生成（state更新前のstale回避）。
      const ss = stage ? stage.strings : scope ? scope.strings : strings;
      const fr = stage ? stage.fretRange : scope ? scope.fretRange : fretRange;
      const nf = stage ? stage.notes : scope ? scope.noteFilter : noteFilter;
      const ad = stage ? false : adaptiveRef.current;
      const mf = stage ? 12 : maxFret;
      // 直近6問と被らない問題を最大6回まで引き直す。
      let q = generateQuestion(mode, rootNote, mf, accidental, ss, fr, nf, ad, stage);
      for (let i = 0; i < 6 && recentKeys.current.includes(keyOf(q)); i++) {
        q = generateQuestion(mode, rootNote, mf, accidental, ss, fr, nf, ad, stage);
      }
      recentKeys.current = [...recentKeys.current, keyOf(q)].slice(-6);
      return q;
    },
    [maxFret, accidental, strings, fretRange, noteFilter, stage]
  );

  const nextQuestion = useCallback(
    (mode?: QuizMode, rootNote?: NoteName) => {
      clearTimeout(feedbackTimer.current);
      answeredRef.current = false;
      const m = mode ?? quiz.mode;
      const r = rootNote ?? quiz.rootNote;
      setShowHint(false);
      setQuiz(buildQuestion(m, r));
      questionShownAt.current = Date.now();
    },
    [quiz.mode, quiz.rootNote, buildQuestion]
  );

  const advanceQuestion = useCallback(
    (mode?: QuizMode, rootNote?: NoteName) => {
      if (!activeRef.current || !answeredRef.current) return;
      clearTimeout(feedbackTimer.current);
      if (questionLimit !== undefined && answerCountRef.current >= questionLimit) {
        activeRef.current = false;
        setStarted(false);
        setShowHint(false);
        roundCompleteRef.current?.();
        return;
      }
      nextQuestion(mode, rootNote);
    },
    [questionLimit, nextQuestion]
  );

  const start = useCallback(
    (
      mode: QuizMode,
      rootNote: NoteName = 'C',
      scope?: { strings: number[]; fretRange: [number, number]; noteFilter: string[] | null },
      adaptive = false,
    ) => {
      clearTimeout(feedbackTimer.current);
      activeRef.current = true;
      answeredRef.current = false;
      answerCountRef.current = 0;
      setStarted(true);
      setShowHint(false);
      adaptiveRef.current = adaptive;
      recentKeys.current = [];
      setQuiz(buildQuestion(mode, rootNote, scope));
      questionShownAt.current = Date.now();
    },
    [buildQuestion]
  );

  const answerNote = useCallback(
    (selectedNote: string) => {
      if (!activeRef.current || answeredRef.current || quiz.feedback || !quiz.currentPosition) return;
      answeredRef.current = true;
      answerCountRef.current++;

      const correct = getNoteAt(
        quiz.currentPosition.string,
        quiz.currentPosition.fret,
        accidental
      );

      // 異名同音を許容（'C#'と'Db'は同一）。表記'both'でも正しく判定される。
      const isCorrect = sameNote(selectedNote, correct);

      if (isCorrect) onCorrect();
      else onWrong();

      onAttempt?.({
        quizType: 'position-to-note',
        isCorrect,
        responseTimeMs: Date.now() - questionShownAt.current,
        string: quiz.currentPosition.string,
        fret: quiz.currentPosition.fret,
        note: correct as NoteName,
        wrong: isCorrect ? undefined : selectedNote,
      });

      setQuiz((prev) => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'wrong',
        correctAnswer: isCorrect ? null : correct,
      }));

      clearTimeout(feedbackTimer.current);
      if (isManualTempo()) return; // 学習モード: 「次へ」待ち
      feedbackTimer.current = setTimeout(() => {
        advanceQuestion();
      }, isCorrect ? CORRECT_DELAY : WRONG_DELAY);
    },
    [quiz.feedback, quiz.currentPosition, accidental, onCorrect, onWrong, onAttempt, advanceQuestion]
  );

  const answerInterval = useCallback(
    (selectedInterval: string) => {
      if (!activeRef.current || answeredRef.current || quiz.feedback || !quiz.currentPosition) return;
      answeredRef.current = true;
      answerCountRef.current++;

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

      // 度数モードは「なぜ?」を読む時間を確保（不正解は長め）
      clearTimeout(feedbackTimer.current);
      if (isManualTempo()) return; // 学習モード: 「次へ」待ち
      feedbackTimer.current = setTimeout(() => {
        advanceQuestion();
      }, isCorrect ? CORRECT_DELAY_INTERVAL : WRONG_DELAY);
    },
    [quiz.feedback, quiz.currentPosition, quiz.rootNote, accidental, onCorrect, onWrong, onAttempt, advanceQuestion]
  );

  const answerPosition = useCallback(
    (pos: FretPosition) => {
      if (!activeRef.current || answeredRef.current || quiz.feedback || !quiz.currentNote) return;
      answeredRef.current = true;
      answerCountRef.current++;

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
        // 誤答時: 実際に押したセルの音（本来その音を探すべきだった＝混同相手）
        wrong: isCorrect ? undefined : getNoteAt(pos.string, pos.fret, accidental),
      });

      setQuiz((prev) => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'wrong',
        correctAnswer: null,
      }));

      clearTimeout(feedbackTimer.current);
      if (isManualTempo()) return; // 学習モード: 「次へ」待ち
      feedbackTimer.current = setTimeout(() => {
        advanceQuestion();
      }, isCorrect ? CORRECT_DELAY : WRONG_DELAY);
    },
    [quiz.feedback, quiz.currentNote, maxFret, accidental, onCorrect, onWrong, onAttempt, advanceQuestion]
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
    activeRef.current = false;
    answeredRef.current = true;
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
    next: advanceQuestion,
    setMode,
    setRootNote,
    toggleHint,
    correctPositions,
  };
}
