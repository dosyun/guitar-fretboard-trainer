import { getAllSessions, getNoteRecognitionMetrics } from '../data/practiceStore';
import { getNoteLabel } from '../data/fretboard';
import type { Accidental } from '../types';
import type { CellMetrics } from '../types/practice';

interface HomePageProps {
  accidental: Accidental;
  onStartPractice: () => void;
  onOpenStats: () => void;
  onShowHelp: () => void;
}

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const weakness = (m: CellMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));

export function HomePage({ accidental, onStartPractice, onOpenStats, onShowHelp }: HomePageProps) {
  const sessions = getAllSessions();
  const metrics = getNoteRecognitionMetrics();
  const totalAttempts = sessions.reduce((a, s) => a + s.count, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const avgMs =
    metrics.length > 0
      ? Math.round(metrics.reduce((a, m) => a + m.avgMs * m.n, 0) / metrics.reduce((a, m) => a + m.n, 0))
      : 0;
  const worst = [...metrics].filter((m) => m.n >= 2).sort((a, b) => weakness(b) - weakness(a))[0];
  const hasData = totalAttempts > 0;

  return (
    <div className="max-w-md mx-auto w-full space-y-5">
      <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
        HOME
      </div>

      {/* 練習カード（主導線） */}
      <div className="bg-surface border border-hair rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink text-balance">指板を反射で使えるようにする</h2>
          <p className="text-dim text-sm mt-1 text-pretty">
            音名を時間制限なしで反復。回答の速さまで記録して、弱点を炙り出します。
          </p>
        </div>
        <button
          onClick={onStartPractice}
          className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
        >
          練習をはじめる
        </button>
      </div>

      {/* 進捗カード */}
      {hasData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="累計問題数" value={`${totalAttempts}`} />
            <Stat label="総合正答率" value={`${accuracy}%`} />
            <Stat label="平均反応" value={sec(avgMs)} />
          </div>

          {worst && (
            <button
              onClick={onOpenStats}
              className="w-full flex items-center justify-between bg-surface border border-hair rounded-xl px-4 py-3 text-sm hover:bg-panel transition-colors"
            >
              <span className="text-dim">
                いま一番の弱点
                <span className="font-mono text-ink ml-2">
                  {6 - worst.pos.string}弦 {worst.pos.fret}F（{getNoteLabel(worst.pos.string, worst.pos.fret, accidental)}）
                </span>
              </span>
              <span className="text-accent text-xs">成績 →</span>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onShowHelp}
          className="w-full bg-surface border border-hair rounded-xl px-4 py-3 text-sm text-dim hover:bg-panel transition-colors text-left"
        >
          はじめての方は <span className="text-accent">使い方ガイド</span> から
        </button>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl py-4 border border-hair">
      <div className="font-mono tabular-nums text-2xl font-medium text-ink">{value}</div>
      <div className="text-dim text-xs mt-1">{label}</div>
    </div>
  );
}
