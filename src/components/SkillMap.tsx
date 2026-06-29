import { getSkillMetrics } from '../data/skillStore';

/**
 * スキルマップ: 音名→度数→トライアド→コードトーン→進行→キー機能 を横断した正答率。
 * 「次に何をやるべきか」が一目で分かる（低い所＝次の練習対象）。
 */
export function SkillMap() {
  const skills = getSkillMetrics();
  const anyData = skills.some((s) => s.n > 0);
  if (!anyData) return null;

  return (
    <div className="bg-surface border border-hair rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink">スキルマップ</h2>
        <span className="text-xs text-dim">種類別の正答率</span>
      </div>
      <div className="space-y-2">
        {skills.map((s) => {
          const pct = Math.round(s.accuracy * 100);
          const color =
            s.n === 0 ? 'var(--hair)' : s.accuracy >= 0.8 ? 'var(--correct)' : s.accuracy >= 0.5 ? 'var(--accent)' : 'var(--wrong)';
          return (
            <div key={s.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-dim">{s.label}</span>
                <span className="font-mono tabular-nums text-ink">
                  {s.n === 0 ? <span className="text-dim">未</span> : `${pct}%`}
                  {s.n > 0 && <span className="text-dim ml-1">({s.n})</span>}
                </span>
              </div>
              <div className="h-2 rounded-full bg-panel overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.n === 0 ? 0 : Math.max(4, pct)}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-dim text-pretty">低い所が次の練習対象。各モードで練習すると埋まる。</p>
    </div>
  );
}
