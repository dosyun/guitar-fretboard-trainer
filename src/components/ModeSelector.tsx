import { Segmented } from 'antd';
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
    <div className="flex justify-center overflow-x-auto">
      <Segmented
        value={current}
        onChange={(v) => onChange(v as QuizMode)}
        options={MODES}
        style={{ minWidth: 'fit-content' }}
      />
    </div>
  );
}
