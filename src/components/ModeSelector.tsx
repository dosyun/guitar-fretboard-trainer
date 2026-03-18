import type { QuizMode } from '../types';

interface ModeSelectorProps {
  current: QuizMode;
  onChange: (mode: QuizMode) => void;
}

const MODES: { value: QuizMode; label: string }[] = [
  { value: 'position-to-note', label: 'ポジション → ノート' },
  { value: 'note-to-position', label: 'ノート → ポジション' },
  { value: 'interval', label: '度数' },
];

export function ModeSelector({ current, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`
            flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
            ${current === value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
