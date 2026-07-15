import { getNoteNames, sameNote } from '../data/fretboard';
import type { Accidental, Feedback } from '../types';

interface NoteSelectorProps {
  accidental: Accidental;
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (note: string) => void;
}

// 回答ボタンは単色（1ビュー1色の規律）。音高カラーは指板マップ等の「見る」画面に限定。
export function NoteSelector({ accidental, feedback, correctAnswer, onSelect }: NoteSelectorProps) {
  const notes = getNoteNames(accidental);

  return (
    <div className="grid grid-cols-4 gap-2 max-w-sm w-full mx-auto">
      {notes.map((note) => {
        const isCorrectHighlight =
          feedback === 'wrong' && correctAnswer !== null && sameNote(note, correctAnswer);
        return (
          <button
            key={note}
            onClick={() => onSelect(note)}
            disabled={feedback !== null}
            aria-label={isCorrectHighlight ? `${note}（正解）` : note}
            className={`
              py-3 px-2 rounded-lg text-base font-semibold font-mono transition-colors
              ${isCorrectHighlight
                ? 'bg-correct text-bg'
                : 'bg-panel hover:bg-accent-soft active:opacity-80 text-ink border border-hair'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {isCorrectHighlight && <span aria-hidden="true">✓ </span>}
            {note}
          </button>
        );
      })}
    </div>
  );
}
