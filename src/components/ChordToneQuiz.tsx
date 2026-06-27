import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from './Fretboard';
import { RootSelector } from './RootSelector';
import { getNoteAt, getNoteNames, getNoteIndex, getAllPositionsForNote } from '../data/fretboard';
import { CHORD_TYPES } from '../data/chords';
import { toneWhy } from '../data/theory';
import type { Accidental, NoteName, FretPosition, Feedback } from '../types';

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
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
  };

  const start = () => {
    setScore({ correct: 0, total: 0 });
    setStarted(true);
    regen(root, typeId);
  };

  const stop = () => {
    clearTimeout(timer.current);
    setStarted(false);
    setTarget(null);
    setFeedback(null);
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
    const ok = getNoteAt(pos.string, pos.fret, accidental) === target.note;
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
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-dim text-xs">正解</div>
              <div className="text-lg font-bold font-mono tabular-nums text-ink">
                {score.correct}/{score.total}
              </div>
            </div>
          </div>

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
            <button onClick={onLearn} className="text-xs text-accent hover:opacity-80 underline">
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
        コードの構成音を指板で見つける練習。ルートとコードタイプを選んで、指定の度数の音をタップしよう。
      </p>
    </>
  );
}
