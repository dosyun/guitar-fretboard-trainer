import { GOALS, setGoal } from '../data/goal';
import type { GoalId } from '../data/goal';

interface OnboardingScreenProps {
  onDone: () => void;
}

/** 初回起動: 目的を聞いて、合った練習を最初におすすめする。 */
export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const choose = (id: GoalId | 'skip') => {
    setGoal(id);
    onDone();
  };

  return (
    <div className="max-w-md mx-auto w-full space-y-5">
      <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
        START
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-bold text-ink text-balance">何ができるようになりたい？</h1>
        <p className="text-dim text-sm text-pretty">目的に合わせて、最初の練習とレッスンをおすすめします。</p>
      </div>

      <div className="space-y-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => choose(g.id)}
            className="w-full text-left bg-surface border border-hair rounded-xl px-4 py-3 hover:bg-panel hover:border-accent transition-colors"
          >
            <div className="text-ink font-medium">{g.label}</div>
            <div className="text-xs text-dim mt-0.5 text-pretty">{g.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => choose('skip')}
        className="w-full text-sm text-dim hover:text-ink transition-colors"
      >
        あとで決める（スキップ）
      </button>
      <p className="text-xs text-dim text-center">設定からいつでも変えられます。</p>
    </div>
  );
}
