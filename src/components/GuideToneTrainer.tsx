import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from './Fretboard';
import { RootSelector } from './RootSelector';
import { getNoteAt, getNoteNames, getNoteIndex, getAllPositionsForNote, INTERVAL_NAMES } from '../data/fretboard';
import { PROGRESSIONS, chordById } from '../data/chords';
import type { ChordTone, ChordTypeDef } from '../data/chords';
import { playChord } from '../data/audio';
import { useSession } from '../hooks/useSession';
import { getLastSession } from '../data/practiceStore';
import { recordSkill } from '../data/skillStore';
import { ResultScreen } from './ResultScreen';
import { QuizFooter, QuizScore } from './QuizChrome';
import type { Accidental, NoteName, FretPosition, Feedback } from '../types';
import type { SessionSummary } from '../types/practice';

interface GuideToneTrainerProps {
  accidental: Accidental;
  maxFret: number;
  onLearn?: () => void;
}

/** コードの 3rd と 7th（＝ガイドトーン）だけを抜き出す。 */
function guideTonesOf(ct: ChordTypeDef): ChordTone[] {
  const out: ChordTone[] = [];
  const third = ct.tones.find((t) => t.deg === '3' || t.deg === '♭3');
  if (third) out.push(third);
  const seventh = ct.tones.find((t) => t.deg === '7' || t.deg === '♭7');
  if (seventh) out.push(seventh);
  return out;
}

/**
 * 実戦課題（ガイドトーン）: 進行のコードを鳴らしながら、各コードの 3rd / 7th を狙う。
 * ガイドトーン＝コードの色を決め、7th→3rd で半音に繋がる“線”。理論を演奏に橋渡し。
 */
export function GuideToneTrainer({ accidental, maxFret, onLearn }: GuideToneTrainerProps) {
  const [keyRoot, setKeyRoot] = useState<NoteName>('C');
  const [progId, setProgId] = useState('ii-v-i');
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0); // 何番目のコードか
  const [guideStep, setGuideStep] = useState(0); // 0=3rd, 1=7th
  const [target, setTarget] = useState<{ deg: string; note: string; st: number; root: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrongPick, setWrongPick] = useState<{ note: string; deg: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null } | null>(null);
  const session = useSession();
  const shownAt = useRef<number>(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const noteNames = getNoteNames(accidental);
  const prog = PROGRESSIONS.find((p) => p.id === progId) ?? PROGRESSIONS[0];
  const keyIdx = getNoteIndex(keyRoot);

  const chords = prog.chords.map((pc) => {
    const ct = chordById(pc.type);
    const rootIdx = (keyIdx + pc.degree) % 12;
    return { roman: pc.roman, ct, rootIdx, symbol: `${noteNames[rootIdx]}${ct.label}` };
  });

  const playChordAt = (rootIdx: number, ct: ChordTypeDef) => {
    const rootMidi = 48 + rootIdx;
    playChord(ct.tones.map((t) => rootMidi + t.st));
  };

  const askWith = (kr: NoteName, pid: string, s: number, g: number) => {
    const p = PROGRESSIONS.find((x) => x.id === pid) ?? PROGRESSIONS[0];
    const pc = p.chords[s];
    const idx = (getNoteIndex(kr) + pc.degree) % 12;
    const ct = chordById(pc.type);
    const guides = guideTonesOf(ct);
    const gt = guides[g] ?? guides[0];
    setTarget({ deg: gt.deg, note: noteNames[(idx + gt.st) % 12], st: gt.st, root: noteNames[idx] });
    setFeedback(null);
    setWrongPick(null);
    shownAt.current = Date.now();
    playChordAt(idx, ct); // バッキング: コードを鳴らす
  };

  const start = () => {
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    setStep(0);
    setGuideStep(0);
    session.startSession('free');
    askWith(keyRoot, progId, 0, 0);
  };
  const stop = () => {
    clearTimeout(timer.current);
    const prev = getLastSession('guidetone');
    const summary = session.finalize();
    setStarted(false);
    setStep(0);
    setGuideStep(0);
    setTarget(null);
    setFeedback(null);
    setResult(summary ? { summary, prev } : null);
  };

  const restart = (kr: NoteName, pid: string) => {
    setStep(0);
    setGuideStep(0);
    askWith(kr, pid, 0, 0);
  };
  const handleKey = (r: NoteName) => {
    setKeyRoot(r);
    if (started) restart(r, progId);
  };
  const handleProg = (pid: string) => {
    setProgId(pid);
    if (started) restart(keyRoot, pid);
  };

  const onTap = (pos: FretPosition) => {
    if (!target || feedback) return;
    const tappedNote = getNoteAt(pos.string, pos.fret, accidental);
    const ok = tappedNote === target.note;
    session.record({
      quizType: 'guidetone',
      isCorrect: ok,
      responseTimeMs: Date.now() - shownAt.current,
      string: pos.string,
      fret: pos.fret,
      rootNote: target.root as NoteName,
      degree: INTERVAL_NAMES[target.st % 12],
    });
    recordSkill('guidetone', ok);
    setWrongPick(ok ? null : { note: tappedNote, deg: INTERVAL_NAMES[(getNoteIndex(tappedNote) - getNoteIndex(target.root) + 12) % 12] });
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setFeedback(ok ? 'correct' : 'wrong');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const guides = guideTonesOf(chords[step].ct);
      let ng = guideStep + 1;
      let nc = step;
      if (ng >= guides.length) {
        ng = 0;
        nc = (step + 1) % chords.length;
      }
      setStep(nc);
      setGuideStep(ng);
      askWith(keyRoot, progId, nc, ng);
    }, ok ? 1300 : 2800);
  };

  const correctPositions =
    feedback === 'wrong' && target ? getAllPositionsForNote(target.note, maxFret, accidental) : undefined;
  const showLabelAt = (s: number, f: number): string | undefined => {
    if (feedback && target && getNoteAt(s, f, accidental) === target.note) return target.note;
    return undefined;
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

  const isSeventh = target ? target.st === 10 || target.st === 11 : false;
  const guideLabel = isSeventh ? '7th' : '3rd';

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
              started && i === step ? 'bg-accent text-bg border-accent font-bold' : 'bg-panel text-dim border-hair'
            }`}
          >
            <span className="text-[10px] opacity-70 mr-1">{c.roman}</span>
            {c.symbol}
          </div>
        ))}
      </div>

      {started && (
        <>
          <QuizScore correct={score.correct} total={score.total} />

          <div className="text-center space-y-2">
            <button
              onClick={() => playChordAt(chords[step].rootIdx, chords[step].ct)}
              className="mx-auto px-5 py-2 bg-panel text-accent border border-hair rounded-lg hover:bg-accent-soft transition-colors font-mono text-sm"
            >
              ▶ コードを聴く
            </button>
            <p className="text-ink font-medium">
              <span className="font-mono text-accent">{chords[step].symbol}</span> の{' '}
              <span className="font-mono text-lg">{guideLabel}</span>（ガイド音）を弾け
            </p>
            {feedback && (
              <p className={`text-lg font-bold ${feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
                {feedback === 'correct' ? '正解!' : `不正解... 正解の音: ${target?.note}`}
              </p>
            )}
            {feedback === 'wrong' && wrongPick && (
              <p className="text-xs text-wrong font-mono">選んだ {wrongPick.note} は {wrongPick.deg}</p>
            )}
            {feedback && (
              <p className="text-xs text-dim text-pretty font-mono">
                {isSeventh ? '7th は次コードの3rdへ半音で解決＝滑らかなライン' : '3rd がコードの明暗を決める'}
              </p>
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

      <QuizFooter
        started={started}
        onStart={start}
        onStop={stop}
        onLearn={onLearn}
        hint="鳴っているコードに合わせて、3rd・7th（ガイドトーン）を狙う実戦課題。ガイド音はコードの色を決め、7th→3rdで滑らかに繋がる。理論を“弾ける”に変える。"
      />
    </>
  );
}
