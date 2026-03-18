import type { Accidental } from '../types';

interface SettingsPanelProps {
  accidental: Accidental;
  maxFret: number;
  onAccidentalChange: (a: Accidental) => void;
  onMaxFretChange: (f: number) => void;
  onReset: () => void;
}

const FRET_OPTIONS = [12, 15, 17, 19, 22];

export function SettingsPanel({ accidental, maxFret, onAccidentalChange, onMaxFretChange, onReset }: SettingsPanelProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-gray-500">表記:</span>
        {([['sharp', '#'], ['flat', '♭'], ['both', '#/♭']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => onAccidentalChange(val)}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              accidental === val
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">フレット:</span>
        <select
          value={maxFret}
          onChange={(e) => onMaxFretChange(Number(e.target.value))}
          className="px-2 py-1 rounded bg-gray-100 border border-gray-200 text-gray-700 font-medium text-sm"
        >
          {FRET_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}F</option>
          ))}
        </select>
      </div>
      <button
        onClick={onReset}
        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
      >
        スコアリセット
      </button>
    </div>
  );
}
