import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { INTERVAL_NAMES } from '../data/fretboard';
import { playMidi } from '../data/audio';
import { useSession } from '../hooks/useSession';
import { getLastSession } from '../data/practiceStore';
import { recordSkill } from '../data/skillStore';
import { ResultScreen } from './ResultScreen';
import type { Accidental, Feedback, IntervalName } from '../types';
import type { SessionSummary } from '../types/practice';

interface EarTrainingQuizProps {
  accidental: Accidental;
  onLearn?: () => void;
}

type EarMode = 'third' | 'chord' | 'interval';

interface Choice {
  key: string;
  label: string;
}

const THIRDS: { key: string; st: number; label: string }[] = [
  { key: 'major', st: 4, label: '長3度（明るい）' },
  { key: 'minor', st: 3, label: '短3度（暗い）' },
];
const CHORDS: { key: string; sts: number[]; label: string }[] = [
  { key: 'major', sts: [0, 4, 7], label: 'メジャー（明るい）' },
  { key: 'minor', sts: [0, 3, 7], label: 'マイナー（暗い）' },
];
const INTERVALS: { key: string; st: number; label: string }[] = [
  { key: 'm3', st: 3, label: '短3度' },
  { key: 'M3', st: 4, label: '長3度' },
  { key: 'P4', st: 5, label: '完全4度' },
  { key: 'P5', st: 7, label: '完全5度' },
  { key: '8ve', st: 12, label: 'オクターブ' },
];

interface Question {
  midis: number[];
  answer: string;
  reveal: string;
  degree: IntervalName;
}

const rand = (n: number) => Math.floor(Math.random() * n);

/** 旋律的（1音ずつ）に鳴らしたあと、和声的（同時）にも鳴らす。 */
function playQuestion(midis: number[]) {
  const step = 0.42;
  midis.forEach((m, i) => playMidi(m, i * step, 0.6));
  const after = midis.length * step + 0.15;
  midis.forEach((m) => playMidi(m, after, 1.4, 0.7));
}

/**
 * 耳トレ（Sound First）: 音だけ聴いて「明るい3rd?暗い3rd?」などを答える。
 * 視覚に頼らず“響き”で理論を身体化する。音が入ったので実現できた。
 */
export function EarTrainingQuiz({ accidental, onLearn }: EarTrainingQuizProps) {
  const [mode, setMode] = useState<EarMode>('third');
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null } | null>(null);
  const session = useSession();
  const shownAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const choices: Choice[] =
    mode === 'third'
      ? THIRDS.map((t) => ({ key: t.key, label: t.label }))
      : mode === 'chord'
        ? CHORDS.map((c) => ({ key: c.key, label: c.label }))
        : INTERVALS.map((i) => ({ key: i.key, label: i.label }));

  const build = (m: EarMode): Question => {
    const rootMidi = 50 + rand(12); // D3〜C#4 あたり
    if (m === 'third') {
      const t = THIRDS[rand(THIRDS.length)];
      return { midis: [rootMidi, rootMidi + t.st], answer: t.key, reveal: t.label, degree: t.st === 4 ? 'M3' : 'm3' };
    }
    if (m === 'chord') {
      const c = CHORDS[rand(CHORDS.length)];
      return {
        midis: c.sts.map((s) => rootMidi + s),
        answer: c.key,
        reveal: c.label,
        degree: c.sts.includes(4) ? 'M3' : 'm3',
      };
    }
    const iv = INTERVALS[rand(INTERVALS.length)];
    return { midis: [rootMidi, rootMidi + iv.st], answer: iv.key, reveal: iv.label, degree: INTERVAL_NAMES[iv.st % 12] };
  };

  const ask = (m: EarMode) => {
    const obj = build(m);
    setQ(obj);
    setPicked(null);
    setFeedback(null);
    shownAt.current = Date.now();
    playQuestion(obj.midis);
  };

  const start = () => {
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    session.startSession('free');
    ask(mode);
  };
  const stop = () => {
    clearTimeout(timer.current);
    const prev = getLastSession('ear');
    const summary = session.finalize();
    setStarted(false);
    setQ(null);
    setPicked(null);
    setFeedback(null);
    setResult(summary ? { summary, prev } : null);
  };

  const handleMode = (m: EarMode) => {
    setMode(m);
    if (started) ask(m);
  };

  const answer = (choiceKey: string) => {
    if (feedback || !q) return;
    const ok = choiceKey === q.answer;
    session.record({
      quizType: 'ear',
      isCorrect: ok,
      responseTimeMs: Date.now() - shownAt.current,
      string: 0,
      fret: 0,
      degree: q.degree,
    });
    recordSkill('ear', ok);
    setPicked(choiceKey);
    setFeedback(ok ? 'correct' : 'wrong');
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => ask(mode), ok ? 1100 : 2400);
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

  return (
    <>
      <div className="flex justify-center overflow-x-auto">
        <Segmented
          value={mode}
          onChange={(v) => handleMode(v as EarMode)}
          options={[
            { label: '3度（明暗）', value: 'third' },
            { label: 'コード（明暗）', value: 'chord' },
            { label: '音程', value: 'interval' },
          ]}
        />
      </div>

      {started && q && (
        <>
          <div className="flex justify-center text-sm">
            <div className="text-center">
              <div className="text-dim text-xs">正解</div>
              <div className="text-lg font-bold font-mono tabular-nums text-ink">
                {score.correct}/{score.total}
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <button
              onClick={() => playQuestion(q.midis)}
              className="mx-auto px-6 py-3 bg-panel text-accent border border-hair rounded-lg hover:bg-accent-soft transition-colors font-mono"
            >
              ▶ もう一度聴く
            </button>

            <p className="text-sm text-dim">聴こえた響きは？</p>

            <div className="flex flex-wrap justify-center gap-2">
              {choices.map((c) => {
                let cls = 'bg-panel text-ink border-hair hover:bg-accent-soft';
                if (feedback) {
                  if (c.key === q.answer) cls = 'bg-correct text-bg border-correct';
                  else if (c.key === picked) cls = 'bg-wrong text-white border-wrong';
                  else cls = 'bg-panel text-dim border-hair opacity-60';
                }
                return (
                  <button
                    key={c.key}
                    disabled={!!feedback}
                    onClick={() => answer(c.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-mono border transition-colors ${cls}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <p className={`font-bold ${feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
                {feedback === 'correct' ? '正解!' : '不正解...'} <span className="font-mono text-ink">{q.reveal}</span>
              </p>
            )}
          </div>
        </>
      )}

      {!started ? (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={start}
            className="px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            スタート
          </button>
          {onLearn && (
            <button onClick={() => onLearn()} className="text-xs text-accent hover:opacity-80 underline">
              はじめて？ まず学ぶ →
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={stop}
          className="mx-auto px-6 py-2 text-sm bg-panel text-dim border border-hair rounded-lg hover:bg-accent-soft transition-colors"
        >
          終了
        </button>
      )}

      <p className="text-xs text-dim text-center text-pretty">
        音だけを聴いて答える耳トレ。長3度=明るい、短3度=暗い…を“響き”で覚えると、視覚に頼らず演奏・耳コピに繋がる。
        （音オフ時は設定でON）
      </p>
    </>
  );
}
