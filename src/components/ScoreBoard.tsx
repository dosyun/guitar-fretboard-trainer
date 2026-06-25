import type { ScoreState } from '../types';

interface ScoreBoardProps {
  score: ScoreState;
}

export function ScoreBoard({ score }: ScoreBoardProps) {
  const accuracy = score.total > 0
    ? Math.round((score.correct / score.total) * 100)
    : 0;

  return (
    <div className="flex justify-center gap-6 text-sm">
      <div className="text-center">
        <div className="text-dim text-xs">正解率</div>
        <div className="text-lg font-bold font-mono tabular-nums text-ink">
          {score.total > 0 ? `${accuracy}%` : '-'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-dim text-xs">正解数</div>
        <div className="text-lg font-bold font-mono tabular-nums text-ink">
          {score.correct}/{score.total}
        </div>
      </div>
      <div className="text-center">
        <div className="text-dim text-xs">連続</div>
        <div className="text-lg font-bold font-mono tabular-nums text-accent">
          {score.streak}
        </div>
      </div>
      <div className="text-center">
        <div className="text-dim text-xs">最高</div>
        <div className="text-lg font-bold font-mono tabular-nums text-ink">
          {score.bestStreak}
        </div>
      </div>
    </div>
  );
}
