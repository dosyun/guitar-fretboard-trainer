import { useState } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../data/audio';
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
  const [sound, setSound] = useState(isSoundEnabled());
  return (
    <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-dim">音:</span>
        <button
          onClick={() => { const next = !sound; setSoundEnabled(next); setSound(next); }}
          className={`px-3 py-1 rounded text-sm font-medium font-mono transition-colors border ${
            sound ? 'bg-accent-soft text-accent border-accent' : 'bg-panel text-dim border-hair hover:bg-accent-soft'
          }`}
        >
          {sound ? '♪ ON' : 'OFF'}
        </button>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-dim">表記:</span>
        {([['sharp', '#'], ['flat', '♭'], ['both', '#/♭']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => onAccidentalChange(val)}
            className={`px-2 py-1 rounded text-sm font-medium font-mono transition-colors ${
              accidental === val
                ? 'bg-accent-soft text-accent border border-accent'
                : 'bg-panel hover:bg-accent-soft text-dim border border-hair'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-dim">フレット:</span>
        <select
          value={maxFret}
          onChange={(e) => onMaxFretChange(Number(e.target.value))}
          className="px-2 py-1 rounded bg-panel border border-hair text-ink font-medium font-mono text-sm"
        >
          {FRET_OPTIONS.map((f) => (
            <option key={f} value={f}>{f}F</option>
          ))}
        </select>
      </div>
      <button
        onClick={onReset}
        className="px-3 py-1 rounded bg-panel hover:bg-accent-soft text-dim border border-hair transition-colors"
      >
        スコアリセット
      </button>
    </div>
  );
}
