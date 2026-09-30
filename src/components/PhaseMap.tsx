import { PHASES, computePhaseStatus } from '../data/phases';
import type { Phase, PhaseStatus } from '../data/phases';

interface PhaseMapProps {
  onStartPhase: (p: Phase) => void;
}

export function PhaseMap({ onStartPhase }: PhaseMapProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-ink">学習マップ</h2>
      <ul className="space-y-2">
        {PHASES.map((p, i) => {
          const st = computePhaseStatus(p);
          return (
            <li key={p.id}>
              <button
                onClick={() => onStartPhase(p)}
                className="w-full text-left bg-surface border border-hair rounded-xl p-4 flex items-start gap-4 hover:bg-panel"
              >
                <span className="size-12 shrink-0 flex items-center justify-center rounded-lg bg-bg border border-hair text-accent text-xl font-mono tabular-nums" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-ink font-semibold">
                    {p.title}
                  </span>
                  <Badge st={st} />
                </div>
                <div className="h-1 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(st.progress * 100)}%`,
                      background: st.clear ? 'var(--correct)' : 'var(--accent)',
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-dim">
                  <span>{p.scope}</span>
                  {st.started ? (
                    <span className="font-mono tabular-nums">
                      正答率 {Math.round(st.accuracy * 100)}% ・ 反応 {(st.avgMs / 1000).toFixed(1)}s
                    </span>
                  ) : (
                    <span className="font-mono tabular-nums">
                      目標 {Math.round(p.targetAcc * 100)}% / {(p.targetMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Badge({ st }: { st: PhaseStatus }) {
  if (st.clear) {
    return (
      <span className="shrink-0 text-xs font-medium text-correct bg-panel border border-hair rounded-full px-2 py-1">
        ✓ クリア
      </span>
    );
  }
  if (st.started) {
    return (
      <span className="shrink-0 text-xs font-medium text-accent bg-accent-soft border border-accent rounded-full px-2 py-1">
        挑戦中
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs text-dim bg-panel border border-hair rounded-full px-2 py-1">
      未着手
    </span>
  );
}
