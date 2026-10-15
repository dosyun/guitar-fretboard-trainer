import { phrase } from '../i18n';
import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { RootSelector } from './RootSelector';
import { getNoteNames, getNoteIndex, INTERVAL_NAMES } from '../data/fretboard';
import { useSession } from '../hooks/useSession';
import { getLastSession } from '../data/practiceStore';
import { FootSwitch } from './FootSwitch';
import { footSwitchGridClass } from './footSwitchGrid';
import { QuizFooter, QuizScore, QuizStart } from './QuizChrome';
import { recordSkill } from '../data/skillStore';
import { ResultScreen } from './ResultScreen';
import type { Accidental, NoteName, Feedback } from '../types';
import type { SessionSummary } from '../types/practice';

interface KeyFunctionQuizProps {
  accidental: Accidental;
  onLearn?: () => void;
}

interface DiatonicChord {
  st: number;
  sym: string;
  roman: string;
  func: 'T' | 'SD' | 'D';
}

const DIATONIC: DiatonicChord[] = [
  { st: 0, sym: '', roman: 'I', func: 'T' },
  { st: 2, sym: 'm', roman: 'ii', func: 'SD' },
  { st: 4, sym: 'm', roman: 'iii', func: 'T' },
  { st: 5, sym: '', roman: 'IV', func: 'SD' },
  { st: 7, sym: '', roman: 'V', func: 'D' },
  { st: 9, sym: 'm', roman: 'vi', func: 'T' },
  { st: 11, sym: 'dim', roman: 'vii°', func: 'D' },
];
const ROMANS = DIATONIC.map((d) => d.roman);
const FUNCS: { val: 'T' | 'SD' | 'D'; label: string }[] = [
  { val: 'T', label: 'トニック' },
  { val: 'SD', label: 'サブドミナント' },
  { val: 'D', label: 'ドミナント' },
];
const FUNC_LABEL: Record<string, string> = { T: 'トニック', SD: 'サブドミナント', D: 'ドミナント' };
const FUNC_WHY: Record<string, string> = {
  T: '安定・帰る場所（I/iii/vi）。',
  SD: '動き出す（IV/ii）。ドミナントへ向かう。',
  D: '緊張（V/vii°）。トニックへ解決したい。',
};

type QType = 'roman' | 'func';

/**
 * キー機能クイズ: 「Key C で Am は何度（vi）？ G は何の機能（ドミナント）？」
 * 音名ではなく“キーの中での役割”を答える。作曲・耳コピ・アドリブに直結。
 */
export function KeyFunctionQuiz({ accidental, onLearn }: KeyFunctionQuizProps) {
  const [keyRoot, setKeyRoot] = useState<NoteName>('C');
  const [qType, setQType] = useState<QType>('roman');
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null } | null>(null);
  const session = useSession();
  const shownAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const noteNames = getNoteNames(accidental);
  const keyIdx = getNoteIndex(keyRoot);
  const chord = DIATONIC[idx];
  const symbol = `${noteNames[(keyIdx + chord.st) % 12]}${chord.sym}`;

  const ask = (prevIdx: number) => {
    let n = prevIdx;
    while (n === prevIdx) n = Math.floor(Math.random() * DIATONIC.length);
    setIdx(n);
    setPicked(null);
    setFeedback(null);
    shownAt.current = Date.now();
  };

  const start = () => {
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    session.startSession('free');
    ask(-1);
  };
  const stop = () => {
    clearTimeout(timer.current);
    const prev = getLastSession('keyfunc');
    const summary = session.finalize();
    setStarted(false);
    setPicked(null);
    setFeedback(null);
    setResult(summary ? { summary, prev } : null);
  };

  const handleKey = (r: NoteName) => {
    setKeyRoot(r);
    if (started) ask(-1);
  };
  const handleType = (t: QType) => {
    setQType(t);
    if (started) ask(-1);
  };

  const answer = (choice: string) => {
    if (feedback) return;
    const ok = qType === 'roman' ? choice === chord.roman : choice === chord.func;
    session.record({
      quizType: 'keyfunc',
      isCorrect: ok,
      responseTimeMs: Date.now() - shownAt.current,
      string: 0,
      fret: 0,
      rootNote: keyRoot,
      degree: INTERVAL_NAMES[chord.st],
    });
    recordSkill('keyfunc', ok);
    setPicked(choice);
    setFeedback(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => ask(idx), ok ? 1300 : 2800);
  };

  if (result) {
    return (
      <ResultScreen
        summary={result.summary}
        prev={result.prev}
        accidental={accidental}
        showDrill={false}
        onRestart={() => start()}
        onClose={() => setResult(null)}
      />
    );
  }

  const correctVal = qType === 'roman' ? chord.roman : chord.func;
  const choices: { val: string; label: string }[] =
    qType === 'roman' ? ROMANS.map((r) => ({ val: r, label: r })) : FUNCS.map((f) => ({ val: f.val, label: f.label }));

  return (
    <>
      <RootSelector label="キー:" current={keyRoot} accidental={accidental} onChange={handleKey} />

      <div className="flex justify-center">
        <Segmented
          value={qType}
          onChange={(v) => handleType(v as QType)}
          options={[
            { label: '度数（ローマ数字）', value: 'roman' },
            { label: '機能', value: 'func' },
          ]}
        />
      </div>

      <div className="rounded-2xl bg-surface border border-hair border-t-case-edge p-3 sm:p-6 flex flex-col gap-3 sm:gap-4">
        {started ? (
          <>
          <QuizScore correct={score.correct} total={score.total} />

          <div className="text-center space-y-2">
            <p className="text-ink font-medium">
              {phrase('Key {0} で {1} は？', [
                <span key="key" className="font-mono text-accent">{keyRoot}</span>,
                <span key="chord" className="font-mono text-xl text-accent">{symbol}</span>,
              ])}
            </p>

            <div className={footSwitchGridClass(choices.map((c) => c.label))}>
              {choices.map((c) => {
                const isAnswer = !!feedback && c.val === correctVal;
                const isWrongPick = !!feedback && c.val === picked && !isAnswer;
                return (
                  <FootSwitch
                    key={c.val}
                    label={c.label}
                    lamp={isAnswer ? 'correct' : isWrongPick ? 'wrong' : 'off'}
                    dimmed={!!feedback && !isAnswer && !isWrongPick}
                    disabled={!!feedback}
                    onClick={() => answer(c.val)}
                  />
                );
              })}
            </div>

            {feedback && (
              <div className="space-y-0.5">
                <p className={`font-semibold ${feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
                  {feedback === 'correct' ? '正解!' : '不正解...'}
                </p>
                <p className="text-sm text-ink">
                  {symbol} = {chord.roman}（{FUNC_LABEL[chord.func]}）
                </p>
                <p className="text-xs text-dim text-pretty">{FUNC_WHY[chord.func]}</p>
              </div>
            )}
          </div>
          </>
        ) : (
          <QuizStart onStart={start} onLearn={onLearn} />
        )}
      </div>

      <QuizFooter
        started={started}
        onStop={stop}
        hint="音名ではなく“キーの中での役割”を答える練習。FはIV、Amはvi、Vはドミナント…が分かると、曲の構造・耳コピ・アドリブに直結する。"
      />
    </>
  );
}
