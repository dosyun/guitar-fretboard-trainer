import { useState, useRef } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from './Fretboard';
import { RootSelector } from './RootSelector';
import { getNoteAt, getNoteNames, getNoteIndex, getMidiAt, INTERVAL_NAMES } from '../data/fretboard';
import { playMidi, playChord } from '../data/audio';
import { recordSkill } from '../data/skillStore';
import type { Accidental, NoteName, FretPosition, Feedback } from '../types';

interface TriadBuilderProps {
  accidental: Accidental;
  maxFret: number;
  onLearn?: () => void;
}

interface Quality {
  id: string;
  label: string;
  sym: string;
  sts: number[]; // ルートからの半音
  degs: string[];
}

const QUALITIES: Quality[] = [
  { id: 'major', label: 'メジャー', sym: '', sts: [0, 4, 7], degs: ['R', '3', '5'] },
  { id: 'minor', label: 'マイナー', sym: 'm', sts: [0, 3, 7], degs: ['R', '♭3', '5'] },
  { id: 'dim', label: 'ディミニッシュ', sym: 'dim', sts: [0, 3, 6], degs: ['R', '♭3', '♭5'] },
];

/**
 * トライアドビルダー: R・3・5 を指板から「自分で集めて」コードを作る。
 * maj↔min で3度が変わる＝明暗が変わるのを体感。完成すると和音が鳴る。
 */
export function TriadBuilder({ accidental, maxFret, onLearn }: TriadBuilderProps) {
  const [root, setRoot] = useState<NoteName>('C');
  const [qualId, setQualId] = useState('major');
  const [started, setStarted] = useState(false);
  const [collected, setCollected] = useState<{ st: number; deg: string; pos: FretPosition }[]>([]);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrongPos, setWrongPos] = useState<FretPosition | null>(null);
  const [wrongMsg, setWrongMsg] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const qual = QUALITIES.find((q) => q.id === qualId)!;
  const rootIdx = getNoteIndex(root);
  const noteNames = getNoteNames(accidental);
  const symbol = `${root}${qual.sym}`;
  const spelling = qual.sts.map((st) => noteNames[(rootIdx + st) % 12]);
  const collectedSts = new Set(collected.map((c) => c.st));

  const reset = () => {
    setCollected([]);
    setDone(false);
    setFeedback(null);
    setWrongPos(null);
    setWrongMsg(null);
  };

  const start = () => {
    reset();
    setScore(0);
    setStarted(true);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setStarted(false);
    reset();
  };

  const handleRoot = (r: NoteName) => {
    setRoot(r);
    if (started) reset();
  };
  const handleQual = (id: string) => {
    setQualId(id);
    if (started) reset();
  };

  const onTap = (pos: FretPosition) => {
    if (!started || done) return;
    const midi = getMidiAt(pos.string, pos.fret);
    const note = getNoteAt(pos.string, pos.fret, accidental);
    const rel = (getNoteIndex(note) - rootIdx + 12) % 12;
    const idx = qual.sts.indexOf(rel);

    playMidi(midi);
    recordSkill('triad', idx !== -1);

    if (idx === -1) {
      setWrongPos(pos);
      setFeedback('wrong');
      setWrongMsg(`それは ${INTERVAL_NAMES[rel]}。${symbol} には要らない音。`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setFeedback(null);
        setWrongPos(null);
        setWrongMsg(null);
      }, 1500);
      return;
    }

    if (collectedSts.has(rel)) return; // この度数はもう集めた

    const next = [...collected, { st: rel, deg: qual.degs[idx], pos }];
    setCollected(next);
    setWrongMsg(null);

    if (next.length === qual.sts.length) {
      setDone(true);
      setFeedback('correct');
      setScore((s) => s + 1);
      playChord(next.map((c) => getMidiAt(c.pos.string, c.pos.fret)));
      clearTimeout(timer.current);
      timer.current = setTimeout(reset, 1900);
    }
  };

  const labelAt = (s: number, f: number): string | undefined =>
    collected.find((c) => c.pos.string === s && c.pos.fret === f)?.deg;

  return (
    <>
      <RootSelector current={root} accidental={accidental} onChange={handleRoot} />

      <div className="flex justify-center overflow-x-auto">
        <Segmented
          value={qualId}
          onChange={(v) => handleQual(v as string)}
          options={QUALITIES.map((q) => ({ label: q.label, value: q.id }))}
          style={{ minWidth: 'fit-content' }}
        />
      </div>

      {started && (
        <>
          <div className="flex justify-center text-sm">
            <div className="text-center">
              <div className="text-dim text-xs">完成</div>
              <div className="text-lg font-bold font-mono tabular-nums text-ink">{score}</div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="text-ink font-medium">
              <span className="font-mono text-accent">{symbol}</span>（{qual.label}）を作ろう
            </p>
            <p className="text-xs text-dim font-mono">{symbol} = {spelling.join(' · ')}</p>
            <div className="flex justify-center gap-2 pt-1">
              {qual.degs.map((d, i) => {
                const got = collectedSts.has(qual.sts[i]);
                return (
                  <span
                    key={d}
                    className={`px-3 py-1 rounded-lg text-sm font-mono border ${
                      got ? 'bg-correct text-bg border-correct' : 'bg-panel text-dim border-hair'
                    }`}
                  >
                    {got ? '✓ ' : ''}{d}
                  </span>
                );
              })}
            </div>
            {done && <p className="text-correct font-bold mt-1">✓ {symbol} 完成！</p>}
            {wrongMsg && <p className="text-wrong text-sm mt-1 font-mono">{wrongMsg}</p>}
          </div>
        </>
      )}

      <div className="bg-surface rounded-xl border border-hair p-2 overflow-x-auto">
        <Fretboard
          maxFret={maxFret}
          accidental={accidental}
          highlightPosition={wrongPos}
          feedback={feedback}
          showLabelAt={labelAt}
          onPositionClick={started && !done ? onTap : undefined}
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
        コードは“覚える”より“作る”。R・3・5を指板から集めよう。メジャー↔マイナーで3度が変わり、明るさが切り替わる。
        完成したら別の場所でも作ってみよう。
      </p>
    </>
  );
}
