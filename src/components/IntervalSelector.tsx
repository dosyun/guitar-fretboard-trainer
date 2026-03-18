import { INTERVAL_NAMES } from '../data/fretboard';
import type { Feedback } from '../types';

interface IntervalSelectorProps {
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (interval: string) => void;
}

export function IntervalSelector({ feedback, correctAnswer, onSelect }: IntervalSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
      {INTERVAL_NAMES.map((interval) => {
        const isCorrectHighlight = feedback === 'wrong' && interval === correctAnswer;
        return (
          <button
            key={interval}
            onClick={() => onSelect(interval)}
            disabled={feedback !== null}
            className={`
              py-3 px-2 rounded-lg text-base font-semibold transition-colors
              ${isCorrectHighlight
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 hover:bg-purple-100 active:bg-purple-200 text-gray-800'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {interval}
          </button>
        );
      })}
    </div>
  );
}
