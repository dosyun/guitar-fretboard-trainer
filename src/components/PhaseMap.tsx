import { PHASES } from '../data/phases';
import type { Phase } from '../data/phases';
import { getStageStatus } from '../data/stageTutorial';

interface PhaseMapProps {
  onStartPhase: (p: Phase) => void;
}

export function PhaseMap({ onStartPhase }: PhaseMapProps) {
  const statuses = PHASES.map(getStageStatus);
  const nextIndex = statuses.findIndex((status) => !status.clear);
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">学習マップ</h2>
      {(['note', 'degree'] as const).map((kind) => (
        <section key={kind} className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            {kind === 'note' ? '音名の6段階' : '度数の5段階'}
          </h3>
          <ul className="divide-y divide-hair border-y border-hair">
            {PHASES.map((phase, index) => {
              if (phase.kind !== kind) return null;
              const status = statuses[index];
              return (
                <li key={phase.id}>
                  <button
                    onClick={() => onStartPhase(phase)}
                    className="flex min-h-12 w-full items-start gap-4 py-4 text-left hover:bg-panel"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-glass font-mono text-xl tabular-nums text-ink" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{phase.title}</span>
                        <span className={status.clear
                          ? 'rounded border border-correct px-2 text-xs text-correct'
                          : 'rounded border border-hair px-2 text-xs text-dim'}>
                          {status.clear ? '✓ クリア' : status.seenAt != null ? '覚え方を見た' : '未着手'}
                        </span>
                      </div>
                      {index === nextIndex && <p className="text-xs font-semibold text-ink">次はここ</p>}
                      <div className="h-1 overflow-hidden bg-glass" aria-hidden="true">
                        <div
                          className={status.clear ? 'h-full bg-correct' : 'h-full bg-dim'}
                          style={{ width: `${Math.round(status.progress * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-dim">{phase.scope}</p>
                      <p className="font-mono text-xs tabular-nums text-dim">
                        目標 {Math.round(phase.targetAcc * 100)}% / {(phase.targetMs / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
