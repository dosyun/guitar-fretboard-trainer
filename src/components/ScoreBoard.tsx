import type { ScoreState } from '../types';

interface ScoreBoardProps {
  score: ScoreState;
}

// 小さな読み取り4つ (docs/design-system/README.md「読み取り」)。主な数字の「連続」だけ LED の琥珀。
export function ScoreBoard({ score }: ScoreBoardProps) {
  const accuracy = score.total > 0
    ? Math.round((score.correct / score.total) * 100)
    : 0;

  const readings = [
    { label: '正解率', value: score.total > 0 ? `${accuracy}%` : '—', lit: false },
    { label: '正解数', value: `${score.correct}/${score.total}`, lit: false },
    { label: '連続', value: String(score.streak), lit: true },
    { label: '最高', value: String(score.bestStreak), lit: false },
  ];

  return (
    <dl className="grid grid-cols-4 gap-3 rounded-lg bg-glass p-3 sm:p-4">
      {readings.map((r) => (
        <div key={r.label} className="min-w-0">
          <dt className="text-xs text-dim">{r.label}</dt>
          <dd className={`whitespace-nowrap font-mono text-xl sm:text-3xl leading-tight ${r.lit ? 'text-accent' : 'text-ink'}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
