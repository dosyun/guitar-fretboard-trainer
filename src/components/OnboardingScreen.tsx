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
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink text-balance">ギターの指板を覚える練習アプリ</h1>
        <p className="text-dim text-sm leading-relaxed text-pretty">音名や度数のクイズで、弱点を見つけながら指板を覚えます。まず目的を選ぶと、最初の練習をすすめます。</p>
      </div>

      <div className="space-y-1 border-t border-hair pt-6">
        <h2 className="text-base font-semibold text-ink">何ができるようになりたい？</h2>
        <p className="text-dim text-sm leading-relaxed text-pretty">目的に合わせて、最初のレッスンもおすすめします。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => choose(g.id)}
            className="flex min-h-32 w-full flex-col justify-between gap-4 text-left bg-panel border border-hair rounded-lg p-4 hover:border-dim"
          >
            <div className="text-base text-ink font-semibold">{g.label}</div>
            <div className="text-sm leading-relaxed text-dim text-pretty">{g.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => choose('skip')}
        className="min-h-12 w-full rounded-lg bg-panel border border-hair px-4 text-sm text-ink hover:border-dim"
      >
        あとで決める（スキップ）
      </button>
      <p className="text-xs text-dim text-center">設定からいつでも変えられます。</p>
    </div>
  );
}
