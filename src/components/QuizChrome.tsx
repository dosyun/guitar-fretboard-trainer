/**
 * 各専門クイズ（コードトーン/進行/ガイド音/キー機能/耳トレ/トライアド）で
 * 逐語的に重複していた「開始/終了」と「スコア表示」を共通化した部品。
 * ※出題生成・回答判定など各クイズ固有のロジックは各コンポーネントに残す
 *   （画面ごとに異なり、無理に統合するとリグレッションを招くため）。
 */

interface QuizStartProps {
  onStart: () => void;
  onLearn?: () => void;
}

/**
 * 未開始時に筐体の中（読み取りの位置）へ置く開始操作。
 * 基本練習の「チャレンジ開始」と同じ窓の形にそろえる (docs/design-system/README.md「構成」)。
 */
export function QuizStart({ onStart, onLearn }: QuizStartProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-glass p-4 sm:p-6">
      <button
        onClick={onStart}
        className="min-h-12 px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80"
      >
        スタート
      </button>
      {onLearn && (
        <button onClick={onLearn} className="min-h-12 px-4 text-sm text-dim hover:text-ink underline">
          はじめて？ まず学ぶ →
        </button>
      )}
    </div>
  );
}

interface QuizFooterProps {
  started: boolean;
  onStop: () => void;
  /** 筐体の下に出す1行説明 */
  hint?: string;
}

/** 筐体の下に置く、控えめな終了ボタンと1行説明 */
export function QuizFooter({ started, onStop, hint }: QuizFooterProps) {
  return (
    <>
      {started && (
        <button
          onClick={onStop}
          className="mx-auto px-6 min-h-12 text-sm bg-panel text-ink border border-hair rounded-lg hover:border-dim"
        >
          終了
        </button>
      )}
      {hint && <p className="text-xs text-dim text-center text-pretty">{hint}</p>}
    </>
  );
}

export function QuizScore({ correct, total }: { correct: number; total: number }) {
  return (
    <div className="flex justify-center gap-6 text-sm">
      <div className="text-center">
        <div className="text-dim text-xs">正解</div>
        <div className="text-xl font-semibold font-mono tabular-nums text-ink">
          {correct}/{total}
        </div>
      </div>
    </div>
  );
}
