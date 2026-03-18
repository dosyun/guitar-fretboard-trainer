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
      <span className="text-sm text-gray-500 font-medium">ルート:</span>
      {notes.map((note) => (
        <button
          key={note}
          onClick={() => onChange(note as NoteName)}
          className={`
            w-9 h-9 rounded-full text-xs font-semibold transition-colors
            ${current === note
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
            }
          `}
        >
          {note}
        </button>
      ))}
    </div>
  );
}
