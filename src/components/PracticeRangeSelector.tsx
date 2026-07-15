import { getNoteNames, NOTE_COLORS } from '../data/fretboard';
import type { Accidental } from '../types';

interface PracticeRangeSelectorProps {
  selectedStrings: number[];
  fretRange: [number, number];
  maxFret: number;
  accidental: Accidental;
  selectedNotes: string[] | null; // null = 全音名
  onStringsChange: (strings: number[]) => void;
  onFretRangeChange: (range: [number, number]) => void;
  onNotesChange: (notes: string[] | null) => void;
  embedded?: boolean;
}

const STRING_LABELS = ['6弦(E)', '5弦(A)', '4弦(D)', '3弦(G)', '2弦(B)', '1弦(E)'];

const PRESET_BTN =
  'px-2 py-0.5 rounded text-xs bg-panel text-dim hover:bg-accent-soft border border-hair transition-colors';
const SELECT_CLS = 'text-xs bg-panel text-ink border border-hair rounded px-2 py-1 font-mono';

export function PracticeRangeSelector({
  selectedStrings,
  fretRange,
  maxFret,
  accidental,
  selectedNotes,
  onStringsChange,
  onFretRangeChange,
  onNotesChange,
  embedded = false,
}: PracticeRangeSelectorProps) {
  const allNotes = getNoteNames(accidental);

  const toggleString = (s: number) => {
    if (selectedStrings.includes(s)) {
      if (selectedStrings.length > 1) {
        onStringsChange(selectedStrings.filter((v) => v !== s));
      }
    } else {
      onStringsChange([...selectedStrings, s].sort());
    }
  };

  const toggleNote = (note: string) => {
    if (selectedNotes === null) {
      // 全選択状態 → この音名以外を全部選択
      onNotesChange(allNotes.filter((n) => n !== note));
    } else if (selectedNotes.includes(note)) {
      if (selectedNotes.length > 1) {
        onNotesChange(selectedNotes.filter((n) => n !== note));
      }
    } else {
      const updated = [...selectedNotes, note];
      // 全音名が選択されたらnullに戻す
      if (updated.length === 12) {
        onNotesChange(null);
      } else {
        onNotesChange(updated);
      }
    }
  };

  const isNoteSelected = (note: string) =>
    selectedNotes === null || selectedNotes.includes(note);

  return (
    <div className={`space-y-3 p-3 ${embedded ? '' : 'bg-surface rounded-lg border border-hair'}`}>
      <div className="text-sm font-medium text-dim">練習範囲</div>

      {/* 弦の選択 */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-dim w-8">弦:</span>
        {STRING_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleString(i)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-colors border
              ${selectedStrings.includes(i)
                ? 'bg-accent-soft text-accent border-accent'
                : 'bg-panel text-dim border-hair'
              }
            `}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => onStringsChange([0, 1, 2, 3, 4, 5])}
          className="px-2 py-1 rounded text-xs text-dim hover:bg-panel"
        >
          全弦
        </button>
      </div>

      {/* フレット範囲 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-dim w-8">F:</span>
        <select
          value={fretRange[0]}
          onChange={(e) => onFretRangeChange([Number(e.target.value), fretRange[1]])}
          className={SELECT_CLS}
        >
          {Array.from({ length: maxFret + 1 }, (_, i) => (
            <option key={i} value={i} disabled={i > fretRange[1]}>
              {i}
            </option>
          ))}
        </select>
        <span className="text-xs text-dim">〜</span>
        <select
          value={fretRange[1]}
          onChange={(e) => onFretRangeChange([fretRange[0], Number(e.target.value)])}
          className={SELECT_CLS}
        >
          {Array.from({ length: maxFret + 1 }, (_, i) => (
            <option key={i} value={i} disabled={i < fretRange[0]}>
              {i}
            </option>
          ))}
        </select>
        <span className="text-xs text-dim">フレット</span>
      </div>

      {/* 音名フィルター */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-dim w-8">音:</span>
        {allNotes.map((note) => {
          const color = NOTE_COLORS[note];
          const selected = isNoteSelected(note);
          return (
            <button
              key={note}
              onClick={() => toggleNote(note)}
              style={selected ? { background: color.bg, color: color.text, borderColor: color.border } : {}}
              className={`
                size-7 rounded text-xs font-semibold font-mono transition-opacity border
                ${selected
                  ? 'opacity-100'
                  : 'bg-panel text-dim border-hair opacity-60'
                }
              `}
            >
              {note}
            </button>
          );
        })}
        <button
          onClick={() => onNotesChange(null)}
          className="px-2 py-1 rounded text-xs text-dim hover:bg-panel"
        >
          全音
        </button>
      </div>

      {/* プリセット */}
      <div className="flex gap-1 flex-wrap">
        <span className="text-xs text-dim w-8">例:</span>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([0, 4]); onNotesChange(null); }}
          className={PRESET_BTN}
        >
          開放〜4F
        </button>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([5, 9]); onNotesChange(null); }}
          className={PRESET_BTN}
        >
          5〜9F
        </button>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([0, 12]); onNotesChange(null); }}
          className={PRESET_BTN}
        >
          全範囲
        </button>
        <button
          onClick={() => { onStringsChange([0]); onFretRangeChange([0, 12]); onNotesChange(null); }}
          className={PRESET_BTN}
        >
          6弦のみ
        </button>
        <button
          onClick={() => { onNotesChange(['C', 'E', 'G']); }}
          className={PRESET_BTN}
        >
          C E G
        </button>
        <button
          onClick={() => { onNotesChange(['C', 'D', 'E', 'F', 'G', 'A', 'B']); }}
          className={PRESET_BTN}
        >
          ナチュラルのみ
        </button>
      </div>
    </div>
  );
}
