import { useState } from 'react';
import { Segmented } from 'antd';
import { FretboardHeatmap } from './FretboardHeatmap';
import type { HeatMetric } from './FretboardHeatmap';
import { ProgressChart } from './ProgressChart';
import { MasteryBar } from './MasteryBar';
import { SkillMap } from './SkillMap';
import { MistakeClinic } from './MistakeClinic';
import { getAllSessions, getAllAttempts, getNoteRecognitionMetrics, getDegreeMetrics, getOverallStats } from '../data/practiceStore';
import type { Accidental } from '../types';
import type { DegreeMetrics } from '../types/practice';

const HEAT_HINT: Record<HeatMetric, string> = {
  weakness: '音名認識の弱点（誤答＋遅さ）',
  error: '間違える場所 — 答えを確認して復習',
  speed: '正解だが遅い場所 — 素早い反応を反復',
};

interface StatsPageProps {
  maxFret: number;
  accidental: Accidental;
  onDrill: (note: string | string[]) => void;
}

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const degreeWeak = (m: DegreeMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));
const heatColor = (w: number) => (w < 0.25 ? 'var(--correct)' : w < 0.55 ? 'var(--accent)' : 'var(--wrong)');

export function StatsPage({ maxFret, accidental, onDrill }: StatsPageProps) {
  const [heatMetric, setHeatMetric] = useState<HeatMetric>('weakness');
  const sessions = getAllSessions();
  const attempts = getAllAttempts();
  const metrics = getNoteRecognitionMetrics();
  const degreeWorst = [...getDegreeMetrics()].sort((a, b) => degreeWeak(b) - degreeWeak(a));

  // 全体サマリは Home と同じ定義（完了セッション基準）で統一する。
  const overall = getOverallStats();
  const accuracy = Math.round(overall.accuracy * 100);

  const hasData = sessions.length > 0 || attempts.length > 0 || metrics.length > 0;
  const inProgress = sessions.length === 0 && attempts.length > 0; // 練習中（まだ終了していない）

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
          {inProgress && (
            <div className="bg-accent-soft border border-accent rounded-xl px-4 py-3 text-sm text-pretty">
              <span className="text-accent font-medium">練習中の記録があります。</span>
              <span className="text-dim"> 「終了」すると結果画面に記録され、推移グラフにも反映されます。</span>
            </div>
          )}

          {/* サマリ readout（完了セッションがあるときのみ。練習中は上の案内を出す） */}
          {overall.count > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="累計問題数" value={`${overall.count}`} />
              <Stat label="総合正答率" value={`${accuracy}%`} />
              <Stat label="平均反応" value={sec(overall.avgMs)} />
            </div>
          )}

          {/* 指板習熟度 */}
          <MasteryBar maxFret={maxFret} accidental={accidental} />

          {/* スキルマップ（種類別の正答率） */}
          <SkillMap />

          {/* 弱点診断（言語化） */}
          <MistakeClinic accidental={accidental} onDrill={onDrill} />

          {/* 推移グラフ（終了済みセッションのみ） */}
          {sessions.length > 0 && <ProgressChart sessions={sessions} />}

          {/* ヒートマップ（総合/誤答/遅さ 切替） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-ink">指板ヒートマップ</h2>
              <Segmented
                size="small"
                value={heatMetric}
                onChange={(v) => setHeatMetric(v as HeatMetric)}
                options={[
                  { label: '総合', value: 'weakness' },
                  { label: '誤答', value: 'error' },
                  { label: '遅さ', value: 'speed' },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-dim">
              <span className="text-pretty">{HEAT_HINT[heatMetric]}</span>
              <Legend />
            </div>
            <div className="bg-surface rounded-xl border border-hair p-2 overflow-x-auto">
              <FretboardHeatmap maxFret={maxFret} accidental={accidental} metric={heatMetric} />
            </div>
          </div>

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
