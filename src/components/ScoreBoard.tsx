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
        <div className="text-gray-400">正解率</div>
        <div className="text-lg font-bold text-gray-800">
          {score.total > 0 ? `${accuracy}%` : '-'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-400">正解数</div>
        <div className="text-lg font-bold text-gray-800">
          {score.correct}/{score.total}
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-400">連続</div>
        <div className="text-lg font-bold text-orange-500">
          {score.streak}
        </div>
      </div>
      <div className="text-center">
        <div className="text-gray-400">最高</div>
        <div className="text-lg font-bold text-purple-600">
          {score.bestStreak}
        </div>
      </div>
    </div>
  );
}
