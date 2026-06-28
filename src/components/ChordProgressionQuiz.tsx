import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from './Fretboard';
import { RootSelector } from './RootSelector';
import { getNoteAt, getNoteNames, getNoteIndex, getAllPositionsForNote, INTERVAL_NAMES } from '../data/fretboard';
import { PROGRESSIONS, chordById } from '../data/chords';
import { toneWhy } from '../data/theory';
import { useSession } from '../hooks/useSession';
import type { Accidental, NoteName, FretPosition, Feedback } from '../types';

interface ChordProgressionQuizProps {
  accidental: Accidental;
  maxFret: number;
  onLearn?: () => void;
}

export function ChordProgressionQuiz({ accidental, maxFret, onLearn }: ChordProgressionQuizProps) {
  const [keyRoot, setKeyRoot] = useState<NoteName>('C');
  const [progId, setProgId] = useState('ii-v-i');
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<{ deg: string; note: string; st: number; root: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const session = useSession();
  const shownAt = useRef<number>(0);

  const noteNames = getNoteNames(accidental);
  const prog = PROGRESSIONS.find((p) => p.id === progId) ?? PROGRESSIONS[0];
  const keyIdx = getNoteIndex(keyRoot);

  // 進行をキーへ転調して解決
  const chords = prog.chords.map((pc) => {
    const ct = chordById(pc.type);
    const rootIdx = (keyIdx + pc.degree) % 12;
    return { roman: pc.roman, ct, rootIdx, symbol: `${noteNames[rootIdx]}${ct.label}` };
  });

  // 明示引数で出題（state staleを回避）
  const askWith = (kr: NoteName, pid: string, s: number) => {
    const p = PROGRESSIONS.find((x) => x.id === pid) ?? PROGRESSIONS[0];
    const idx = (getNoteIndex(kr) + p.chords[s].degree) % 12;
    const ct = chordById(p.chords[s].type);
    const t = ct.tones[Math.floor(Math.random() * ct.tones.length)];
    setTarget({ deg: t.deg, note: noteNames[(idx + t.st) % 12], st: t.st, root: noteNames[idx] });
    setFeedback(null);
    shownAt.current = Date.now();
  };

  const start = () => {
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    setStep(0);
    session.startSession('free');
    askWith(keyRoot, progId, 0);
  };
  const stop = () => {
    clearTimeout(timer.current);
    session.finalize();
    setStarted(false);
    setStep(0);
    setTarget(null);
    setFeedback(null);
  };

  const handleKey = (r: NoteName) => {
    setKeyRoot(r);
    if (started) {
      setStep(0);
      askWith(r, progId, 0);
    }
  };
  const handleProg = (pid: string) => {
    setProgId(pid);
    if (started) {
      setStep(0);
      askWith(keyRoot, pid, 0);
    }
  };

  const onTap = (pos: FretPosition) => {
    if (!target || feedback) return;
    const ok = getNoteAt(pos.string, pos.fret, accidental) === target.note;
    session.record({
      quizType: 'interval',
      isCorrect: ok,
      responseTimeMs: Date.now() - shownAt.current,
      string: pos.string,
      fret: pos.fret,
      degree: INTERVAL_NAMES[target.st % 12],
    });
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setFeedback(ok ? 'correct' : 'wrong');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = (step + 1) % chords.length;
      setStep(next);
      askWith(keyRoot, progId, next);
    }, ok ? 1300 : 2800);
  };

  const correctPositions =
    feedback === 'wrong' && target ? getAllPositionsForNote(target.note, maxFret, accidental) : undefined;
  const showLabelAt = (s: number, f: number): string | undefined => {
    if (feedback && target && getNoteAt(s, f, accidental) === target.note) return target.note;
    return undefined;
  };

  return (
    <>
      <div className="flex items-center gap-2 justify-center flex-wrap">
        <span className="text-sm text-dim">キー:</span>
        <RootSelector current={keyRoot} accidental={accidental} onChange={handleKey} />
      </div>

      <div className="flex justify-center overflow-x-auto">
        <Segmented
          value={progId}
          onChange={(v) => handleProg(v as string)}
          options={PROGRESSIONS.map((p) => ({ label: p.label, value: p.id }))}
          style={{ minWidth: 'fit-content' }}
        />
      </div>

      {/* 進行ストリップ（現在のコードを強調） */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {chords.map((c, i) => (
          <div
            key={i}
            className={`px-3 py-1.5 rounded-lg border text-sm font-mono ${
              started && i === step
                ? 'bg-accent text-bg border-accent font-bold'
                : 'bg-panel text-dim border-hair'
            }`}
          >
            <span className="text-[10px] opacity-70 mr-1">{c.roman}</span>
            {c.symbol}
          </div>
        ))}
      </div>

      {started && (
        <>
          <div className="flex justify-center text-sm">
            <div className="text-center">
              <div className="text-dim text-xs">正解</div>
              <div className="text-lg font-bold font-mono tabular-nums text-ink">
                {score.correct}/{score.total}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-ink font-medium">
              <span className="font-mono text-accent">{chords[step].symbol}</span> の{' '}
              <span className="font-mono text-lg">{target?.deg}</span> を弾け
            </p>
            {feedback && (
              <p className={`text-lg font-bold mt-1 ${feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
                {feedback === 'correct' ? '正解!' : `不正解... 正解の音: ${target?.note}`}
              </p>
            )}
            {feedback && target && (
              <p className="text-xs text-dim mt-1 text-pretty font-mono">{toneWhy(target.deg, target.st, target.root, target.note)}</p>
            )}
          </div>
        </>
      )}

      <div className="bg-surface rounded-xl border border-hair p-2 overflow-x-auto">
        <Fretboard
          maxFret={maxFret}
          accidental={accidental}
          highlightPosition={null}
          feedback={feedback}
          correctPositions={correctPositions}
          showLabelAt={showLabelAt}
          onPositionClick={started ? onTap : undefined}
        />
      </div>

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
        コード進行に合わせて、各コードのターゲット音を指板で押さえる練習。チェンジに乗ってコードトーンを狙う感覚を養う。
      </p>
    </>
  );
}
