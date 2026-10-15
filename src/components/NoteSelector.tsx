import { useState } from 'react';
import { getNoteNames, sameNote } from '../data/fretboard';
import type { Accidental, Feedback } from '../types';
import { FootSwitch } from './FootSwitch';

interface NoteSelectorProps {
  accidental: Accidental;
  feedback: Feedback;
  correctAnswer: string | null;
  onSelect: (note: string) => void;
}

// 12音のフットスイッチ。回答ボタンは単色（1ビュー1色の規律）。音高カラーは指板マップ等の「見る」画面に限定。
export function NoteSelector({ accidental, feedback, correctAnswer, onSelect }: NoteSelectorProps) {
  const notes = getNoteNames(accidental);
  // 押したスイッチ。回答後(feedback あり)の間だけランプに使う
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 w-full">
      {notes.map((note) => {
        const isAnswer =
          (feedback === 'wrong' && correctAnswer !== null && sameNote(note, correctAnswer)) ||
          (feedback === 'correct' && pressed !== null && sameNote(note, pressed));
        const isWrongPick = feedback === 'wrong' && pressed !== null && sameNote(note, pressed) && !isAnswer;
        return (
          <FootSwitch
            key={note}
            label={note}
            lamp={isAnswer ? 'correct' : isWrongPick ? 'wrong' : 'off'}
            dimmed={feedback !== null && !isAnswer && !isWrongPick}
            disabled={feedback !== null}
            ariaLabel={feedback === 'wrong' && isAnswer ? `${note}（正解）` : note}
            onClick={() => { setPressed(note); onSelect(note); }}
          />
        );
      })}
    </div>
  );
}
