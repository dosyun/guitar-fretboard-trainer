import { getNoteNames } from '../data/fretboard';
import type { NoteName, Accidental } from '../types';

interface RootSelectorProps {
  current: NoteName;
  accidental: Accidental;
  onChange: (root: NoteName) => void;
}

export function RootSelector({ current, accidental, onChange }: RootSelectorProps) {
  const notes = getNoteNames(accidental);

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-sm text-dim font-medium">ルート:</span>
      {notes.map((note) => (
        <button
          key={note}
          onClick={() => onChange(note as NoteName)}
          className={`
            size-9 rounded-full text-xs font-semibold font-mono transition-colors
            ${current === note
              ? 'bg-accent text-bg'
              : 'bg-panel text-dim hover:bg-accent-soft'
            }
          `}
        >
          {note}
        </button>
      ))}
    </div>
  );
}
