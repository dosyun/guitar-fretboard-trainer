import { PHASES, computePhaseStatus } from '../data/phases';
import type { Phase, PhaseStatus } from '../data/phases';

interface PhaseMapProps {
  onStartPhase: (p: Phase) => void;
}

export function PhaseMap({ onStartPhase }: PhaseMapProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-ink">学習マップ</h2>
      <ul className="space-y-2">
        {PHASES.map((p, i) => {
          const st = computePhaseStatus(p);
          return (
            <li key={p.id}>
              <button
                onClick={() => onStartPhase(p)}
                className="w-full text-left bg-surface border border-hair rounded-xl px-4 py-3 space-y-2 hover:bg-panel transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-ink font-medium">
                    <span className="font-mono text-dim mr-2">{i + 1}</span>
                    {p.title}
                  </span>
                  <Badge st={st} />
                </div>
                <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(st.progress * 100)}%`,
                      background: st.clear ? 'var(--correct)' : 'var(--accent)',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-dim">
                  <span>{p.scope}</span>
                  {st.started ? (
                    <span className="font-mono tabular-nums">
                      {Math.round(st.accuracy * 100)}% / {(st.avgMs / 1000).toFixed(1)}s
                    </span>
                  ) : (
                    <span>未着手</span>
                  )}
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
      <span className="shrink-0 text-[11px] font-medium text-correct bg-panel border border-hair rounded-full px-2 py-0.5">
        ✓ クリア
      </span>
    );
  }
  if (st.started) {
    return (
      <span className="shrink-0 text-[11px] font-medium text-accent bg-accent-soft border border-accent rounded-full px-2 py-0.5">
        挑戦中
      </span>
    );
  }
  return (
    <span className="shrink-0 text-[11px] text-dim bg-panel border border-hair rounded-full px-2 py-0.5">
      未着手
    </span>
  );
}
