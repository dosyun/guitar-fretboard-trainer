import { useCallback, useEffect, useState } from 'react';
import type { Accidental, FretPosition } from '../types';
import type { AttemptInput, SessionSummary } from '../types/practice';
import { PHASES, STAGE_GUIDED_COUNT, STAGE_TEST_COUNT, type Phase } from '../data/phases';
import { getNoteAt, getNoteLabel } from '../data/fretboard';
import {
  TUTORIAL_ROOT, degreeOf, explainAnswer, getStageStatus,
  markStageSeen, saveStageResult, passesStage,
} from '../data/stageTutorial';
import { isManualTempo } from '../data/tempo';
import { intervalLabel } from '../i18n';
import { useQuiz } from '../hooks/useQuiz';
import { useSession } from '../hooks/useSession';
import { Fretboard } from './Fretboard';
import { PracticeReadout } from './PracticeReadout';
import { NoteSelector } from './NoteSelector';
import { IntervalSelector } from './IntervalSelector';

interface StageTutorialProps {
  stage: Phase;
  accidental: Accidental;
  onClose: () => void;
  onNext: (stage: Phase) => void;
  onLearn: (id: string) => void;
}
type Step = 'learn' | 'guided' | 'ready' | 'test' | 'result';
const primaryButton = 'min-h-12 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg hover:opacity-90';
const secondaryButton = 'min-h-12 rounded-lg border border-hair bg-panel px-4 py-3 text-sm text-ink';
const textButton = 'min-h-12 text-sm text-dim underline hover:text-ink';
const noop = () => {};

function guidedLabels(stage: Phase, root: FretPosition) {
  const strings = stage.id === 'deg-cross'
    ? [4, 5] : [root.string, root.string + 1, root.string + 2];
  const positions: FretPosition[] = [];
  for (const string of strings) {
    for (let fret = root.fret - 3; fret <= root.fret + 4; fret++) {
      const position = { string, fret };
      if (string === root.string && fret === root.fret) continue;
      if (stage.degrees.includes(degreeOf(position, root))) positions.push(position);
    }
  }
  return positions.map((position) => ({ position, label: degreeOf(position, root) }));
}

interface QuizRoundProps {
  stage: Phase;
  accidental: Accidental;
  guided: boolean;
  onComplete: (summary: SessionSummary) => void;
}
function QuizRound({ stage, accidental, guided, onComplete }: QuizRoundProps) {
  const limit = guided ? STAGE_GUIDED_COUNT : STAGE_TEST_COUNT;
  const { startSession, record, finalize, count, correct } = useSession();
  const [times, setTimes] = useState<number[]>([]);
  const handleAttempt = useCallback((input: AttemptInput) => {
    record(input);
    setTimes((previous) => [...previous, input.responseTimeMs]);
  }, [record]);
  const handleComplete = useCallback(() => {
    const summary = finalize();
    if (summary && times.length) {
      onComplete({ ...summary, avgMs: times.reduce((sum, ms) => sum + ms, 0) / times.length });
    }
  }, [finalize, onComplete, times]);
  const { quiz, start, stop, next, answerNote, answerInterval } = useQuiz({
    maxFret: Math.max(5, stage.fretRange[1]),
    accidental, strings: stage.strings, fretRange: stage.fretRange, noteFilter: stage.notes,
    stage, questionLimit: limit, onRoundComplete: handleComplete,
    onAttempt: handleAttempt, onCorrect: noop, onWrong: noop,
  });
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      startSession('free');
      start(stage.mode);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      stop();
      finalize();
    };
  }, [startSession, start, stage.mode, stop, finalize]);

  const position = quiz.currentPosition;
  const root = quiz.rootPosition;
  const answer = position
    ? stage.kind === 'degree' && root
      ? degreeOf(position, root)
      : getNoteAt(position.string, position.fret, accidental)
    : null;
  const answerLabel = stage.kind === 'degree' ? intervalLabel(answer) : answer;
  const ghosts = !guided ? undefined : stage.kind === 'degree'
    ? root ? guidedLabels(stage, root) : []
    : stage.markers.map((marker) => ({
      position: marker, label: getNoteAt(marker.string, marker.fret, accidental),
    }));
  const avgMs = times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : null;
  const prompt = !position ? '問題を準備しています' : stage.kind === 'degree'
    ? `${6 - position.string}弦 ${position.fret}フレットの度数は？`
    : `${6 - position.string}弦 ${position.fret}フレットの音名は？`;

  return (
    <>
      <PracticeReadout
        big={quiz.feedback ? answerLabel : null}
        feedback={quiz.feedback} prompt={prompt}
        lastMs={times.at(-1) ?? null} avgMs={avgMs}
        correct={correct} total={count}
        progressLabel={guided ? '見ながら3問' : '見ずに10問'}
        progress={`${count}/${limit}`}
      />
      <div className="min-h-12 space-y-2" role="status" aria-live="polite">
        {quiz.feedback && (
          <p className={`text-sm font-semibold ${quiz.feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
            {quiz.feedback === 'correct' ? '✓ 正解!' : `✕ 不正解... 正解: ${answerLabel}`}
          </p>
        )}
        {quiz.feedback === 'wrong' && position && (
          <p className="text-sm text-dim text-pretty">
            {stage.title}: {explainAnswer(stage.id, position, root, accidental)}
          </p>
        )}
        {guided && !quiz.feedback && <p className="text-sm text-dim text-pretty">{stage.rule}</p>}
      </div>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-glass p-2">
        <Fretboard
          maxFret={Math.max(5, stage.fretRange[1])} accidental={accidental}
          highlightPosition={position} feedback={quiz.feedback}
          rootPosition={root} ghostLabels={ghosts}
          showLabelAt={(string, fret) => (
            quiz.feedback && position?.string === string && position.fret === fret
              ? answer ?? undefined : undefined
          )}
        />
      </div>
      {stage.kind === 'degree' ? (
        <IntervalSelector feedback={quiz.feedback} correctAnswer={quiz.correctAnswer} onSelect={answerInterval} />
      ) : (
        <NoteSelector accidental={accidental} feedback={quiz.feedback} correctAnswer={quiz.correctAnswer} onSelect={answerNote} />
      )}
      {isManualTempo() && quiz.feedback && (
        <button type="button" className={primaryButton} onClick={() => next()}>次へ</button>
      )}
    </>
  );
}

/** 覚え方の図で光らせる場所（度数はルートも含む）の中央のフレット。スマホの横スクロールで見える位置に寄せる */
function learnFocusFret(stage: Phase): number {
  const frets = stage.markers.map((marker) => marker.fret);
  if (stage.kind === 'degree') frets.push(TUTORIAL_ROOT.fret);
  return Math.round((Math.min(...frets) + Math.max(...frets)) / 2);
}

export function StageTutorial({ stage, accidental, onClose, onNext, onLearn }: StageTutorialProps) {
  const [step, setStep] = useState<Step>('learn');
  const [result, setResult] = useState<SessionSummary | null>(null);
  const [previouslyCleared] = useState(() => getStageStatus(stage).clear);
  const handleComplete = useCallback((summary: SessionSummary) => {
    if (step === 'guided') {
      setStep('ready');
    } else if (summary.count === STAGE_TEST_COUNT) {
      saveStageResult(stage.id, summary.correct, summary.avgMs, summary.count);
      setResult(summary);
      setStep('result');
    }
  }, [stage.id, step]);
  useEffect(() => { markStageSeen(stage.id); }, [stage.id]);
  const passed = result !== null && passesStage(stage, result.correct, result.avgMs, result.count);
  const nextStage = PHASES[PHASES.findIndex((phase) => phase.id === stage.id) + 1];
  const stepLabel = step === 'learn' ? '覚え方'
    : step === 'guided' || step === 'ready' ? '見ながら3問'
      : step === 'test' ? '見ずに10問' : '10問の結果';

  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-ink text-balance">{stage.title}</h1>
          <p className="mt-2 text-sm text-dim">{stepLabel}</p>
        </div>
        <button type="button" className={textButton} onClick={onClose}>学習マップへ戻る</button>
      </header>
      <div className="min-w-0 space-y-4 rounded-2xl border border-hair border-t-case-edge bg-surface p-3 sm:p-6">
        {step === 'learn' && (
          <>
            <p className="text-base text-ink text-pretty">{stage.rule}</p>
            <p className="text-sm text-dim text-pretty">{stage.scope}</p>
            <div className="min-w-0 overflow-x-auto rounded-lg bg-glass p-2">
              <Fretboard
                maxFret={Math.max(5, stage.fretRange[1])} accidental={accidental}
                highlightPosition={null} feedback={null}
                rootPosition={stage.kind === 'degree' ? TUTORIAL_ROOT : undefined}
                focusFret={learnFocusFret(stage)}
                showLabelAt={(string, fret) => {
                  if (!stage.markers.some((marker) => marker.string === string && marker.fret === fret)) return undefined;
                  return stage.kind === 'degree'
                    ? degreeOf({ string, fret }, TUTORIAL_ROOT)
                    : stage.id === 'sharps-flats' ? getNoteLabel(string, fret, 'both') : getNoteAt(string, fret, accidental);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className={primaryButton} onClick={() => setStep('guided')}>見ながら3問</button>
              {previouslyCleared && (
                <button type="button" className={secondaryButton} onClick={() => setStep('test')}>見ずに10問から始める</button>
              )}
            </div>
            <button type="button" className={textButton} onClick={() => onLearn(stage.lessonId)}>関連するレッスンを開く</button>
          </>
        )}
        {(step === 'guided' || step === 'test') && (
          <QuizRound key={step} stage={stage} accidental={accidental} guided={step === 'guided'} onComplete={handleComplete} />
        )}
        {step === 'ready' && (
          <>
            <h2 className="text-base font-semibold text-ink">見ながら3問が終わりました</h2>
            <p className="text-sm text-dim text-pretty">次は目印を消して10問答えます。</p>
            <button type="button" className={primaryButton} onClick={() => setStep('test')}>見ずに10問</button>
          </>
        )}
        {step === 'result' && result && (
          <>
            <h2 className={`text-base font-semibold ${passed ? 'text-correct' : 'text-ink'}`}>
              {passed ? '✓ クリア' : 'もう一度練習'}
            </h2>
            <dl className="flex flex-wrap gap-6 rounded-lg bg-glass p-4">
              <div>
                <dt className="text-sm text-dim">正答数</dt>
                <dd className="font-mono text-3xl tabular-nums text-accent">{result.correct}/10</dd>
              </div>
              <div>
                <dt className="text-sm text-dim">平均反応時間</dt>
                <dd className="font-mono text-3xl tabular-nums text-ink">
                  {(result.avgMs / 1000).toFixed(2)}<span className="ml-2 text-sm text-dim">秒</span>
                </dd>
              </div>
            </dl>
            <p className="text-sm text-dim text-pretty">
              {`クリアの目標: 9/10問以上正解・平均${(stage.targetMs / 1000).toFixed(1)}秒以内`}
            </p>
            <div className="flex flex-wrap gap-3">
              {passed ? (
                <button type="button" className={primaryButton} onClick={() => nextStage ? onNext(nextStage) : onClose()}>
                  {nextStage ? '次の段階へ' : '学習マップへ'}
                </button>
              ) : (
                <>
                  <button type="button" className={primaryButton} onClick={() => setStep('test')}>もう一度10問</button>
                  <button type="button" className={secondaryButton} onClick={() => setStep('learn')}>覚え方をもう一度</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
