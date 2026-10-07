import { intervalLabel } from '../i18n';
import { INTERVAL_NAMES } from '../data/fretboard';
import type { Feedback } from '../types';

interface IntervalSelectorProps {
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (interval: string) => void;
}

export function IntervalSelector({ feedback, correctAnswer, onSelect }: IntervalSelectorProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-w-xl w-full mx-auto">
      {INTERVAL_NAMES.map((interval) => {
        const isCorrectHighlight = feedback === 'wrong' && interval === correctAnswer;
        return (
          <button
            key={interval}
            onClick={() => onSelect(interval)}
            disabled={feedback !== null}
            aria-label={isCorrectHighlight ? `${intervalLabel(interval)}（正解）` : intervalLabel(interval)}
            className={`
              min-h-12 py-3 px-2 rounded-lg text-base font-semibold font-mono shadow-sm
              ${isCorrectHighlight
                ? 'bg-correct text-bg'
                : 'bg-panel hover:bg-accent-soft active:opacity-80 text-ink border border-hair'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {isCorrectHighlight && <span aria-hidden="true">✓ </span>}
            {intervalLabel(interval)}
          </button>
        );
      })}
    </div>
  );
}
