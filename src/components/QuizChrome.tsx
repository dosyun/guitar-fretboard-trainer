/**
 * 各専門クイズ（コードトーン/進行/ガイド音/キー機能/耳トレ/トライアド）で
 * 逐語的に重複していた「開始/終了フッター」と「スコア表示」を共通化した部品。
 * ※出題生成・回答判定など各クイズ固有のロジックは各コンポーネントに残す
 *   （画面ごとに異なり、無理に統合するとリグレッションを招くため）。
 */

interface QuizFooterProps {
  started: boolean;
  onStart: () => void;
  onStop: () => void;
  onLearn?: () => void;
  /** 未開始時に下部へ出す1行説明 */
  hint?: string;
}

export function QuizFooter({ started, onStart, onStop, onLearn, hint }: QuizFooterProps) {
  return (
    <>
      {!started ? (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            スタート
          </button>
          {onLearn && (
            <button onClick={onLearn} className="text-xs text-accent hover:opacity-80 underline">
              はじめて？ まず学ぶ →
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onStop}
          className="mx-auto px-6 py-2 text-sm bg-panel text-dim border border-hair rounded-lg hover:bg-accent-soft transition-colors"
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
        <div className="text-lg font-bold font-mono tabular-nums text-ink">
          {correct}/{total}
        </div>
      </div>
    </div>
  );
}
