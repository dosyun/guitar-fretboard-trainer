import { FretboardHeatmap } from './FretboardHeatmap';
import { ProgressChart } from './ProgressChart';
import { getAllSessions, getNoteRecognitionMetrics, getDegreeMetrics } from '../data/practiceStore';
import { getNoteLabel } from '../data/fretboard';
import type { Accidental } from '../types';
import type { CellMetrics, DegreeMetrics } from '../types/practice';

interface StatsPageProps {
  maxFret: number;
  accidental: Accidental;
}

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const weakness = (m: CellMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));
const degreeWeak = (m: DegreeMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));
const heatColor = (w: number) => (w < 0.25 ? 'var(--correct)' : w < 0.55 ? 'var(--accent)' : 'var(--wrong)');

export function StatsPage({ maxFret, accidental }: StatsPageProps) {
  const sessions = getAllSessions();
  const metrics = getNoteRecognitionMetrics();
  const degreeWorst = [...getDegreeMetrics()].sort((a, b) => degreeWeak(b) - degreeWeak(a));

  const totalAttempts = sessions.reduce((a, s) => a + s.count, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const avgMs =
    metrics.length > 0
      ? Math.round(metrics.reduce((a, m) => a + m.avgMs * m.n, 0) / metrics.reduce((a, m) => a + m.n, 0))
      : 0;

  const worst = [...metrics]
    .filter((m) => m.n >= 2)
    .sort((a, b) => weakness(b) - weakness(a))
    .slice(0, 5);

  const hasData = totalAttempts > 0;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-5">
      <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
        STATS
      </div>

      {!hasData ? (
        <div className="bg-surface border border-hair rounded-2xl p-8 text-center space-y-3">
          <p className="text-ink font-medium text-balance">まだ練習記録がありません</p>
          <p className="text-dim text-sm text-pretty">
            クイズで音名を練習すると、ここに正答率・反応速度・指板の弱点ヒートマップが表示されます。
          </p>
        </div>
      ) : (
        <>
          {/* サマリ readout */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="累計問題数" value={`${totalAttempts}`} />
            <Stat label="総合正答率" value={`${accuracy}%`} />
            <Stat label="平均反応" value={sec(avgMs)} />
          </div>

          {/* 推移グラフ */}
          <ProgressChart sessions={sessions} />

          {/* ヒートマップ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">指板ヒートマップ（音名認識）</h2>
              <Legend />
            </div>
            <div className="bg-surface rounded-xl border border-hair p-2 overflow-x-auto">
              <FretboardHeatmap maxFret={maxFret} accidental={accidental} />
            </div>
          </div>

          {/* 苦手ポジション */}
          {worst.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-ink">苦手なポジション</h2>
              <ul className="space-y-1">
                {worst.map((m) => (
                  <li
                    key={`${m.pos.string}-${m.pos.fret}`}
                    className="flex items-center justify-between bg-surface border border-hair rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-ink">
                      {6 - m.pos.string}弦 {m.pos.fret}F
                      <span className="text-dim ml-2">{getNoteLabel(m.pos.string, m.pos.fret, accidental)}</span>
                    </span>
                    <span className="font-mono tabular-nums text-dim">
                      誤答 {Math.round(m.errorRate * 100)}% / {sec(m.avgMs)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 度数の弱点（度数モード） */}
          {degreeWorst.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-ink">度数の弱点（度数モード）</h2>
              <ul className="space-y-1.5">
                {degreeWorst.map((d) => {
                  const w = degreeWeak(d);
                  return (
                    <li key={d.degree} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-ink w-12 shrink-0">{d.degree}</span>
                      <div className="flex-1 h-2 rounded-full bg-panel overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(4, Math.round(w * 100))}%`, background: heatColor(w) }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-dim text-xs w-24 text-right shrink-0">
                        {Math.round(d.errorRate * 100)}% / {sec(d.avgMs)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
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

function Legend() {
  const items = [
    { c: 'var(--correct)', t: '習得' },
    { c: 'var(--accent)', t: '要練習' },
    { c: 'var(--wrong)', t: '苦手' },
  ];
  return (
    <div className="flex items-center gap-2 text-xs text-dim">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full" style={{ background: i.c }} aria-hidden="true" />
          {i.t}
        </span>
      ))}
    </div>
  );
}
