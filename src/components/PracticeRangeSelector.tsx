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
}

const STRING_LABELS = ['6弦(E)', '5弦(A)', '4弦(D)', '3弦(G)', '2弦(B)', '1弦(E)'];

export function PracticeRangeSelector({
  selectedStrings,
  fretRange,
  maxFret,
  accidental,
  selectedNotes,
  onStringsChange,
  onFretRangeChange,
  onNotesChange,
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
    <div className="space-y-3 bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-sm font-medium text-gray-600">練習範囲</div>

      {/* 弦の選択 */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 w-8">弦:</span>
        {STRING_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => toggleString(i)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-colors
              ${selectedStrings.includes(i)
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-50 text-gray-400 border border-gray-200'
              }
            `}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => onStringsChange([0, 1, 2, 3, 4, 5])}
          className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100"
        >
          全弦
        </button>
      </div>

      {/* フレット範囲 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-8">F:</span>
        <select
          value={fretRange[0]}
          onChange={(e) => onFretRangeChange([Number(e.target.value), fretRange[1]])}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          {Array.from({ length: maxFret + 1 }, (_, i) => (
            <option key={i} value={i} disabled={i > fretRange[1]}>
              {i}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">〜</span>
        <select
          value={fretRange[1]}
          onChange={(e) => onFretRangeChange([fretRange[0], Number(e.target.value)])}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          {Array.from({ length: maxFret + 1 }, (_, i) => (
            <option key={i} value={i} disabled={i < fretRange[0]}>
              {i}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">フレット</span>
      </div>

      {/* 音名フィルター */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-xs text-gray-400 w-8">音:</span>
        {allNotes.map((note) => {
          const color = NOTE_COLORS[note];
          const selected = isNoteSelected(note);
          return (
            <button
              key={note}
              onClick={() => toggleNote(note)}
              style={selected ? { background: color.bg, color: color.text, borderColor: color.border } : {}}
              className={`
                w-8 h-7 rounded text-xs font-semibold transition-opacity border
                ${selected
                  ? 'opacity-100'
                  : 'bg-gray-100 text-gray-400 border-gray-200 opacity-50'
                }
              `}
            >
              {note}
            </button>
          );
        })}
        <button
          onClick={() => onNotesChange(null)}
          className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100"
        >
          全音
        </button>
      </div>

      {/* プリセット */}
      <div className="flex gap-1 flex-wrap">
        <span className="text-xs text-gray-400 w-8">例:</span>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([0, 4]); onNotesChange(null); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          開放〜4F
        </button>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([5, 9]); onNotesChange(null); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          5〜9F
        </button>
        <button
          onClick={() => { onStringsChange([0, 1, 2, 3, 4, 5]); onFretRangeChange([0, 12]); onNotesChange(null); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          全範囲
        </button>
        <button
          onClick={() => { onStringsChange([0]); onFretRangeChange([0, 12]); onNotesChange(null); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          6弦のみ
        </button>
        <button
          onClick={() => { onNotesChange(['C', 'E', 'G']); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          C E G
        </button>
        <button
          onClick={() => { onNotesChange(['C', 'D', 'E', 'F', 'G', 'A', 'B']); }}
          className="px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
        >
          ナチュラルのみ
        </button>
      </div>
    </div>
  );
}
