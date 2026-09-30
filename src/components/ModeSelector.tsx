import type { QuizMode } from '../types';

interface ModeSelectorProps {
  current: QuizMode;
  onChange: (mode: QuizMode) => void;
}

const MODES = [
  { label: '位置→音名', value: 'position-to-note' as QuizMode },
  { label: '音名→位置', value: 'note-to-position' as QuizMode },
  { label: '度数', value: 'interval' as QuizMode },
];

export function ModeSelector({ current, onChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label="基本練習のモード">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => { if (current !== mode.value) onChange(mode.value); }}
          aria-pressed={current === mode.value}
          className={`min-h-12 px-4 rounded-lg text-sm font-medium border ${
            current === mode.value
              ? 'bg-accent-soft text-accent border-accent'
              : 'bg-bg text-dim border-hair hover:text-ink hover:bg-panel'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
