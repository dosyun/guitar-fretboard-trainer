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
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="text-xs font-medium text-dim flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
        練習の目標
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink text-balance">何ができるようになりたい？</h1>
        <p className="text-dim text-sm leading-relaxed text-pretty">目的に合わせて、最初の練習とレッスンをおすすめします。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => choose(g.id)}
            className="flex min-h-32 w-full flex-col justify-between gap-4 text-left bg-surface border border-hair rounded-2xl p-6 hover:bg-panel hover:border-accent"
          >
            <div className="text-lg text-ink font-semibold">{g.label}</div>
            <div className="text-sm leading-relaxed text-dim text-pretty">{g.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => choose('skip')}
        className="min-h-12 w-full rounded-xl bg-panel px-4 py-3 text-sm text-dim hover:text-ink"
      >
        あとで決める（スキップ）
      </button>
      <p className="text-xs text-dim text-center">設定からいつでも変えられます。</p>
    </div>
  );
}
