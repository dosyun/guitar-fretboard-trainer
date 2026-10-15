import { getNoteNames } from '../data/fretboard';
import type { NoteName, Accidental } from '../types';

interface RootSelectorProps {
  current: NoteName;
  accidental: Accidental;
  onChange: (root: NoteName) => void;
  /** 行頭のラベル。キーを選ぶ画面では「キー:」にして、外側に別のラベルを足さない */
  label?: string;
}

export function RootSelector({ current, accidental, onChange, label = 'ルート:' }: RootSelectorProps) {
  const notes = getNoteNames(accidental);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-sm text-dim font-semibold">{label}</span>
      {notes.map((note) => (
        <button
          key={note}
          onClick={() => onChange(note as NoteName)}
          className={`
            size-9 rounded-lg border text-xs font-semibold font-mono transition-colors
            ${current === note
              ? 'bg-accent-soft text-accent border-accent'
              : 'bg-panel text-dim border-hair hover:border-dim'
            }
          `}
        >
          {note}
        </button>
      ))}
    </div>
  );
}
