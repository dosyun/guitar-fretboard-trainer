import { getNoteNames, NOTE_COLORS } from '../data/fretboard';
import type { Accidental, Feedback } from '../types';

interface NoteSelectorProps {
  accidental: Accidental;
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (note: string) => void;
}

export function NoteSelector({ accidental, feedback, correctAnswer, onSelect }: NoteSelectorProps) {
  const notes = getNoteNames(accidental);

  return (
    <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
      {notes.map((note) => {
        const isCorrectHighlight = feedback === 'wrong' && note === correctAnswer;
        const color = NOTE_COLORS[note] || { bg: '#6b7280', text: '#fff', border: '#4b5563' };
        return (
          <button
            key={note}
            onClick={() => onSelect(note)}
            disabled={feedback !== null}
            style={
              isCorrectHighlight
                ? { background: '#22c55e', color: '#fff', borderColor: '#16a34a' }
                : { background: color.bg, color: color.text, borderColor: color.border }
            }
            className={`
              py-3 px-2 rounded-lg text-base font-semibold transition-opacity border-2
              hover:opacity-80 active:opacity-70
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {note}
          </button>
        );
      })}
    </div>
  );
}
