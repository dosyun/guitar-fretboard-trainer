import { useState, useRef } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../data/audio';
import { isManualTempo, setManualTempo } from '../data/tempo';
import { exportBackup, importBackup } from '../data/backup';
import type { Accidental } from '../types';

interface SettingsPanelProps {
  accidental: Accidental;
  maxFret: number;
  goalLabel: string | null;
  onChangeGoal: () => void;
  onAccidentalChange: (a: Accidental) => void;
  onMaxFretChange: (f: number) => void;
  onReset: () => void;
  onClearHistory: () => void;
}

const FRET_OPTIONS = [12, 15, 17, 19, 22];

export function SettingsPanel({ accidental, maxFret, goalLabel, onChangeGoal, onAccidentalChange, onMaxFretChange, onReset, onClearHistory }: SettingsPanelProps) {
  const [sound, setSound] = useState(isSoundEnabled());
  const [manual, setManual] = useState(isManualTempo());
  const fileRef = useRef<HTMLInputElement>(null);

  const pad = (n: number) => String(n).padStart(2, '0');
  const handleExport = () => {
    const backup = exportBackup(Date.now());
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date(backup.exportedAt);
    a.href = url;
    a.download = `guitar-flet-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイルを選び直せるように
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let json: unknown;
      try {
        json = JSON.parse(String(reader.result));
      } catch {
        window.alert('ファイルを読み取れませんでした。');
        return;
      }
      if (!window.confirm('現在の練習データにこのバックアップを上書きします。よろしいですか？')) return;
      const res = importBackup(json);
      if (res.ok) {
        window.alert('復元しました。再読み込みします。');
        window.location.reload();
      } else {
        window.alert(res.error ?? '読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-dim">回答:</span>
        <div className="flex gap-1">
          {([[false, '反射(自動)'], [true, '学習(手動)']] as const).map(([val, label]) => (
            <button
              key={label}
              onClick={() => { setManualTempo(val); setManual(val); }}
              className={`px-2.5 py-1 rounded text-sm font-medium transition-colors border ${
                manual === val ? 'bg-accent-soft text-accent border-accent' : 'bg-panel text-dim border-hair hover:bg-accent-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-dim">目標:</span>
        <button
          onClick={onChangeGoal}
          className="px-3 py-1 rounded text-sm font-medium bg-panel text-ink border border-hair hover:bg-accent-soft transition-colors"
        >
          {goalLabel ?? '未設定'} <span className="text-accent">変更</span>
        </button>
      </div>
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
        onClick={handleExport}
        className="px-3 py-1 rounded bg-panel hover:bg-accent-soft text-ink border border-hair transition-colors"
      >
        データを書き出す
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="px-3 py-1 rounded bg-panel hover:bg-accent-soft text-ink border border-hair transition-colors"
      >
        読み込む
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
        className="hidden"
      />
      <button
        onClick={onReset}
        className="px-3 py-1 rounded bg-panel hover:bg-accent-soft text-dim border border-hair transition-colors"
      >
        今回のスコアをリセット
      </button>
      <button
        onClick={onClearHistory}
        className="px-3 py-1 rounded bg-panel hover:bg-accent-soft text-wrong border border-hair transition-colors"
      >
        練習履歴を削除
      </button>
    </div>
  );
}
