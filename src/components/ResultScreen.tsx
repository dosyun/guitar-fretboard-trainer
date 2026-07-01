import { getNoteRecognitionMetrics } from '../data/practiceStore';
import { getNoteAt } from '../data/fretboard';
import type { Accidental } from '../types';
import type { SessionSummary, CellMetrics } from '../types/practice';

interface ResultScreenProps {
  summary: SessionSummary;
  prev: SessionSummary | null;
  challenge?: boolean;
  target?: number | null; // チャレンジの規定問題数（クリア判定に使う）
  accidental: Accidental;
  onDrill?: (note: string) => void;
  /** 音名認識の弱点ドリルCTAを出すか（度数系=コードトーン/進行ではfalse）。 */
  showDrill?: boolean;
  onRestart: () => void;
  onClose: () => void;
}

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const acc = (s: SessionSummary) => (s.count > 0 ? Math.round((s.correct / s.count) * 100) : 0);
const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const weakness = (m: CellMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));

export function ResultScreen({
  summary,
  prev,
  challenge = false,
  target,
  accidental,
  onDrill,
  showDrill = true,
  onRestart,
  onClose,
}: ResultScreenProps) {
  const accuracy = acc(summary);
  // クリア=「規定問題数に到達」かつ「全問正解」。∞(target=null)や途中終了はクリアにしない。
  const cleared =
    challenge && target != null && summary.count >= target && summary.correct === summary.count;

  // 前回比 (改善=correct色 / 悪化=wrong色)
  const accDelta = prev ? accuracy - acc(prev) : null;
  const avgDelta = prev ? summary.avgMs - prev.avgMs : null; // 負=速くなった

  // 一番弱い場所(n>=2) → その音だけ練習する導線（ループを閉じる）
  const weakest = [...getNoteRecognitionMetrics()]
    .filter((m) => m.n >= 2)
    .sort((a, b) => weakness(b) - weakness(a))[0];
  const weakNote = weakest ? getNoteAt(weakest.pos.string, weakest.pos.fret, accidental) : null;

  return (
    <div className="max-w-md mx-auto w-full bg-surface border border-hair rounded-2xl p-6 space-y-6">
      <div
        className="font-mono text-xs tracking-widest flex items-center gap-2"
        style={{ color: cleared ? 'var(--correct)' : 'var(--accent)' }}
      >
        <span
          className="inline-block size-1.5 rounded-full"
          style={{ background: cleared ? 'var(--correct)' : 'var(--accent)' }}
          aria-hidden="true"
        />
        {challenge ? (cleared ? 'CHALLENGE CLEAR' : 'CHALLENGE') : 'SESSION COMPLETE'}
      </div>

      {/* チャレンジ クリア判定 */}
      {challenge && (
        cleared ? (
          <div className="text-center py-1">
            <div className="text-3xl font-bold" style={{ color: 'var(--correct)' }}>✓ クリア！</div>
            <div className="text-dim text-sm mt-1 font-mono tabular-nums">{summary.count}問 全問正解</div>
          </div>
        ) : (
          <div className="text-center py-1">
            <div className="text-2xl font-bold text-ink font-mono tabular-nums">
              {summary.correct}/{summary.count}
            </div>
            <div className="text-dim text-sm mt-1">100%でクリア。もう一度挑戦しよう</div>
          </div>
        )
      )}

      {/* 主要指標 readout */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="正答率" value={`${accuracy}%`} />
        <Stat label="問題数" value={`${summary.count}`} />
        <Stat label="平均" value={sec(summary.avgMs)} />
      </div>

      {/* 中央値・前回比 */}
      <div className="space-y-2 text-sm">
        <Row label="中央値">
          <span className="font-mono tabular-nums text-ink">{sec(summary.medianMs)}</span>
        </Row>
        <Row label="前回比">
          {prev && accDelta !== null && avgDelta !== null ? (
            <span className="font-mono tabular-nums flex items-center gap-3">
              <Delta good={accDelta >= 0} text={`${accDelta >= 0 ? '+' : ''}${accDelta}pp`} />
              <Delta
                good={avgDelta <= 0}
                text={`${avgDelta <= 0 ? '▼' : '▲'}${sec(Math.abs(avgDelta))}`}
              />
            </span>
          ) : (
            <span className="text-dim text-xs">初回 — 次回から比較できます</span>
          )}
        </Row>
      </div>

      {/* 次の一手: 一番弱い場所をその場で潰す（主導線・音名認識のみ） */}
      {showDrill && weakest && weakNote && (
        <div className="space-y-2 pt-1">
          <Row label="一番弱い">
            <span className="font-mono text-ink">
              {6 - weakest.pos.string}弦 {weakest.pos.fret}F（{weakNote}）
            </span>
          </Row>
          <button
            onClick={() => onDrill?.(weakNote)}
            className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            「{weakNote}」を10問だけ練習
          </button>
        </div>
      )}

      {/* アクション */}
      <div className="flex gap-2">
        <button
          onClick={onRestart}
          className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
            showDrill && weakest
              ? 'bg-panel text-ink border border-hair hover:bg-accent-soft'
              : 'bg-accent text-bg font-semibold hover:opacity-90 active:opacity-80'
          }`}
        >
          もう一回
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3 bg-panel text-dim border border-hair rounded-lg hover:bg-accent-soft transition-colors"
        >
          終了
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel rounded-xl py-4 border border-hair">
      <div className="font-mono tabular-nums text-2xl font-medium text-ink text-balance">{value}</div>
      <div className="text-dim text-xs mt-1">{label}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dim">{label}</span>
      {children}
    </div>
  );
}

function Delta({ good, text }: { good: boolean; text: string }) {
  return <span style={{ color: good ? 'var(--correct)' : 'var(--wrong)' }}>{text}</span>;
}
