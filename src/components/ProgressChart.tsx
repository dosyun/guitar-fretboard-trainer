import type { SessionSummary } from '../types/practice';

interface ProgressChartProps {
  sessions: SessionSummary[];
}

const MAX_POINTS = 20;

/**
 * セッション推移の折れ線（軽量SVG、チャートライブラリ非依存）。
 * 正答率(上昇=改善) と 平均反応(下降=高速化) を表示。
 */
export function ProgressChart({ sessions }: ProgressChartProps) {
  const recent = sessions.slice(-MAX_POINTS);
  if (recent.length < 2) {
    return (
      <div className="bg-surface border border-hair rounded-xl px-4 py-3 text-xs text-dim text-pretty">
        セッションを2回以上こなすと、ここに正答率・反応速度の推移が出ます。
      </div>
    );
  }

  const acc = recent.map((s) => (s.count > 0 ? (s.correct / s.count) * 100 : 0));
  const time = recent.map((s) => s.avgMs / 1000);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-ink">推移（直近{recent.length}セッション）</h2>
      <Sparkline
        label="正答率"
        values={acc}
        higherBetter
        fmtValue={(v) => `${Math.round(v)}%`}
        fmtDelta={(d) => `${d >= 0 ? '+' : ''}${Math.round(d)}pp`}
      />
      <Sparkline
        label="平均反応（低いほど速い）"
        values={time}
        higherBetter={false}
        fmtValue={(v) => `${v.toFixed(1)}s`}
        fmtDelta={(d) => `${d <= 0 ? '' : '+'}${d.toFixed(1)}s`}
      />
    </div>
  );
}

interface SparklineProps {
  label: string;
  values: number[];
  higherBetter: boolean;
  fmtValue: (v: number) => string;
  fmtDelta: (d: number) => string;
}

const W = 320;
const H = 56;
const PAD = 6;

function Sparkline({ label, values, higherBetter, fmtValue, fmtDelta }: SparklineProps) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;

  const pts = values.map((v, i) => {
    const x = PAD + (i / (n - 1)) * innerW;
    const y = PAD + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });
  const polyline = pts.map((p) => p.join(',')).join(' ');
  const last = values[n - 1];
  const delta = last - values[0];
  const improved = higherBetter ? delta >= 0 : delta <= 0;

  return (
    <div className="bg-surface border border-hair rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-dim">{label}</span>
        <span className="text-sm font-mono tabular-nums text-ink">
          {fmtValue(last)}
          <span className="ml-2 text-xs" style={{ color: improved ? 'var(--correct)' : 'var(--wrong)' }}>
            {fmtDelta(delta)}
          </span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={pts[n - 1][0]} cy={pts[n - 1][1]} r={3} fill="var(--accent)" />
      </svg>
    </div>
  );
}
