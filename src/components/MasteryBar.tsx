import { getMasterySummary } from '../data/mastery';
import type { Accidental } from '../types';

interface MasteryBarProps {
  maxFret: number;
  accidental: Accidental;
  /** true なら得意/次の行を省きバーだけ */
  compact?: boolean;
}

export function MasteryBar({ maxFret, accidental, compact = false }: MasteryBarProps) {
  const m = getMasterySummary(maxFret, accidental);

  return (
    <div className="bg-surface border border-hair rounded-xl p-4 space-y-2">
      <div className="flex items-end justify-between">
        <span className="text-sm text-dim">指板習熟度</span>
        <span className="font-mono tabular-nums text-2xl font-medium text-ink">{m.overall}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${m.overall}%`, background: 'var(--correct)' }}
        />
      </div>
      {!compact && (m.top || m.weak) && (
        <div className="flex items-center justify-between text-xs pt-1">
          {m.top ? (
            <span className="text-dim">
              得意 <span className="font-mono text-ink">{m.top.note}</span>{' '}
              <span className="font-mono tabular-nums text-correct">{m.top.mastery}</span>
            </span>
          ) : (
            <span />
          )}
          {m.weak && (
            <span className="text-dim">
              次に練習 <span className="font-mono text-ink">{m.weak.note}</span>{' '}
              <span className="font-mono tabular-nums text-wrong">{m.weak.mastery}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
