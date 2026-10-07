import { currentLanguageUrl } from '../i18n';
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
        window.location.replace(currentLanguageUrl());
      } else {
        window.alert(res.error ?? '読み込みに失敗しました。');
      }
    };
    reader.onerror = () => window.alert('ファイルを読み取れませんでした。');
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 text-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">練習の設定</h1>
        <p className="text-sm leading-relaxed text-dim">自分のペースに合わせて、回答方法や指板の表示を調整できます。</p>
      </div>
      <section className="grid gap-6 rounded-2xl border border-hair bg-surface p-6 sm:grid-cols-2 sm:p-8">
        <div className="flex flex-col items-start gap-3">
          <span className="text-dim">回答方法</span>
          <div className="flex flex-wrap gap-2">
            {([[false, '反射(自動)'], [true, '学習(手動)']] as const).map(([val, label]) => (
              <button
                key={label}
                onClick={() => { setManualTempo(val); setManual(val); }}
                className={`min-h-12 px-4 py-3 rounded-xl text-sm font-medium border ${
                  manual === val ? 'bg-accent-soft text-accent border-accent' : 'bg-panel text-dim border-hair hover:bg-accent-soft'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="text-dim">練習の目標</span>
          <button
            onClick={onChangeGoal}
            className="min-h-12 px-4 py-3 rounded-xl text-left text-sm font-medium bg-panel text-ink border border-hair hover:bg-accent-soft"
          >
            {goalLabel ?? '未設定'} <span className="text-accent">変更</span>
          </button>
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="text-dim">音の再生</span>
          <button
            onClick={() => { const next = !sound; setSoundEnabled(next); setSound(next); }}
            className={`min-h-12 min-w-24 px-4 py-3 rounded-xl text-sm font-medium font-mono border ${
              sound ? 'bg-accent-soft text-accent border-accent' : 'bg-panel text-dim border-hair hover:bg-accent-soft'
            }`}
          >
            {sound ? '♪ ON' : 'OFF'}
          </button>
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="text-dim">音名の表記</span>
          <div className="flex flex-wrap gap-2">
            {([['sharp', '#'], ['flat', '♭'], ['both', '#/♭']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => onAccidentalChange(val)}
                className={`min-h-12 min-w-12 px-4 py-3 rounded-xl text-sm font-medium font-mono ${
                  accidental === val
                    ? 'bg-accent-soft text-accent border border-accent'
                    : 'bg-panel hover:bg-accent-soft text-dim border border-hair'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="text-dim">表示するフレット</span>
          <select
            value={maxFret}
            onChange={(e) => onMaxFretChange(Number(e.target.value))}
            className="min-h-12 min-w-32 px-4 py-3 rounded-xl bg-panel border border-hair text-ink font-medium font-mono text-sm"
          >
            {FRET_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}F</option>
            ))}
          </select>
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-hair bg-surface p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-ink">データのバックアップ</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="min-h-12 px-4 py-3 rounded-xl bg-panel hover:bg-accent-soft text-ink border border-hair"
          >
            データを書き出す
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="min-h-12 px-4 py-3 rounded-xl bg-panel hover:bg-accent-soft text-ink border border-hair"
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
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-hair bg-surface p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-ink">記録のリセット</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onReset}
            className="min-h-12 px-4 py-3 rounded-xl bg-panel hover:bg-accent-soft text-dim border border-hair"
          >
            今回のスコアをリセット
          </button>
          <button
            onClick={onClearHistory}
            className="min-h-12 px-4 py-3 rounded-xl text-wrong hover:bg-panel"
          >
            練習履歴を削除
          </button>
        </div>
      </section>
    </div>
  );
}
