import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from './Fretboard';
import { RootSelector } from './RootSelector';
import { getNoteAt, getNoteNames, getNoteIndex, getAllPositionsForNote, INTERVAL_NAMES } from '../data/fretboard';
import { CHORD_TYPES } from '../data/chords';
import { toneWhy } from '../data/theory';
import { useSession } from '../hooks/useSession';
import { getLastSession } from '../data/practiceStore';
import { recordSkill } from '../data/skillStore';
import { ResultScreen } from './ResultScreen';
import { QuizFooter, QuizScore } from './QuizChrome';
import type { Accidental, NoteName, FretPosition, Feedback } from '../types';
import type { SessionSummary } from '../types/practice';

interface ChordToneQuizProps {
  accidental: Accidental;
  maxFret: number;
  onLearn?: () => void;
}

export function ChordToneQuiz({ accidental, maxFret, onLearn }: ChordToneQuizProps) {
  const [root, setRoot] = useState<NoteName>('D');
  const [typeId, setTypeId] = useState('m7');
  const [started, setStarted] = useState(false);
  const [target, setTarget] = useState<{ deg: string; note: string; st: number; root: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrongPick, setWrongPick] = useState<{ note: string; deg: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const session = useSession();
  const shownAt = useRef<number>(0);
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null } | null>(null);

  const noteNames = getNoteNames(accidental);
  const chord = CHORD_TYPES.find((c) => c.id === typeId)!;
  const chordSymbol = `${root}${chord.label}`;
  const spelling = chord.tones.map((t) => noteNames[(getNoteIndex(root) + t.st) % 12]);

  // 出題（root/typeを明示的に渡してstale回避）
  const regen = (r: NoteName, tid: string) => {
    const c = CHORD_TYPES.find((x) => x.id === tid)!;
    const ri = getNoteIndex(r);
    const t = c.tones[Math.floor(Math.random() * c.tones.length)];
    setTarget({ deg: t.deg, note: noteNames[(ri + t.st) % 12], st: t.st, root: r });
    setFeedback(null);
    setWrongPick(null);
    shownAt.current = Date.now();
  };

  const start = () => {
    setResult(null);
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    session.startSession('free');
    regen(root, typeId);
  };

  const stop = () => {
    clearTimeout(timer.current);
    const prev = getLastSession('chordtone');
    const summary = session.finalize();
    setStarted(false);
    setTarget(null);
    setFeedback(null);
    setResult(summary ? { summary, prev } : null);
  };

  const handleRoot = (r: NoteName) => {
    setRoot(r);
    if (started) regen(r, typeId);
  };
  const handleType = (tid: string) => {
    setTypeId(tid);
    if (started) regen(root, tid);
  };

  const onTap = (pos: FretPosition) => {
    if (!target || feedback) return;
    const tappedNote = getNoteAt(pos.string, pos.fret, accidental);
    const ok = tappedNote === target.note;
    session.record({
      quizType: 'chordtone',
      isCorrect: ok,
      responseTimeMs: Date.now() - shownAt.current,
      string: pos.string,
      fret: pos.fret,
      rootNote: root,
      degree: INTERVAL_NAMES[target.st % 12],
    });
    recordSkill('chordtone', ok);
    setWrongPick(ok ? null : { note: tappedNote, deg: INTERVAL_NAMES[(getNoteIndex(tappedNote) - getNoteIndex(root) + 12) % 12] });
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setFeedback(ok ? 'correct' : 'wrong');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => regen(root, typeId), ok ? 1300 : 2800);
  };

  // 不正解時に正解音の位置を緑で表示
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

  return (
    <>
      <RootSelector current={root} accidental={accidental} onChange={handleRoot} />

      <div className="flex justify-center overflow-x-auto">
        <Segmented
          value={typeId}
          onChange={(v) => handleType(v as string)}
          options={CHORD_TYPES.map((c) => ({ label: c.label || 'major', value: c.id }))}
          style={{ minWidth: 'fit-content' }}
        />
      </div>

      {started && (
        <>
          <QuizScore correct={score.correct} total={score.total} />

          <div className="text-center">
            <p className="text-ink font-medium">
              <span className="font-mono text-accent">{chordSymbol}</span> の{' '}
              <span className="font-mono text-lg">{target?.deg}</span> を選べ
            </p>
            <p className="text-xs text-dim mt-1 font-mono">
              {chordSymbol} = {spelling.join(' · ')}
            </p>
            {feedback && (
              <p className={`text-lg font-bold mt-1 ${feedback === 'correct' ? 'text-correct' : 'text-wrong'}`}>
                {feedback === 'correct' ? '正解!' : `不正解... 正解の音: ${target?.note}`}
              </p>
            )}
            {feedback === 'wrong' && wrongPick && (
              <p className="text-xs text-wrong mt-0.5 font-mono">
                選んだ {wrongPick.note} は {wrongPick.deg}（このコードの構成音ではない）
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

      <QuizFooter
        started={started}
        onStart={start}
        onStop={stop}
        onLearn={onLearn}
        hint="コードの構成音を指板で見つける練習。ルートとコードタイプを選んで、指定の度数の音をタップしよう。"
      />
    </>
  );
}
