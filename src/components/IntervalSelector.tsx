import { useState } from 'react';
import { intervalLabel } from '../i18n';
import { INTERVAL_NAMES } from '../data/fretboard';
import type { Feedback } from '../types';
import { FootSwitch } from './FootSwitch';

interface IntervalSelectorProps {
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (interval: string) => void;
}

// 12度数のフットスイッチ (NoteSelector と同じ並びと状態ランプ)
export function IntervalSelector({ feedback, correctAnswer, onSelect }: IntervalSelectorProps) {
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 w-full">
      {INTERVAL_NAMES.map((interval) => {
        const isAnswer =
          (feedback === 'wrong' && interval === correctAnswer) || (feedback === 'correct' && interval === pressed);
        const isWrongPick = feedback === 'wrong' && interval === pressed && !isAnswer;
        return (
          <FootSwitch
            key={interval}
            label={intervalLabel(interval)}
            lamp={isAnswer ? 'correct' : isWrongPick ? 'wrong' : 'off'}
            dimmed={feedback !== null && !isAnswer && !isWrongPick}
            disabled={feedback !== null}
            ariaLabel={feedback === 'wrong' && isAnswer ? `${intervalLabel(interval)}（正解）` : intervalLabel(interval)}
            onClick={() => { setPressed(interval); onSelect(interval); }}
          />
        );
      })}
    </div>
  );
}
