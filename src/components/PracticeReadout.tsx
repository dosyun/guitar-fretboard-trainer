import type { ReactNode } from 'react';
import type { Feedback } from '../types';

interface PracticeReadoutProps {
  /** 巨大表示する音名・度数。回答前で答えを伏せるときは null (「?」を表示) */
  big: string | null;
  feedback: Feedback;
  prompt: ReactNode;
  /** 問題文の下に出す正誤・ヒント・理由 */
  children?: ReactNode;
  lastMs: number | null;
  avgMs: number | null;
  correct: number;
  total: number;
  progressLabel: ReactNode;
  progress: string;
}

const METER_MAX_MS = 3000;

function seconds(ms: number | null): string {
  return ms == null ? '—' : (ms / 1000).toFixed(2);
}

/**
 * 反応時間メーター: 0〜3秒の目盛り。1秒未満=緑、2秒未満=琥珀、それ以上=赤の帯と今回の針。
 * (補助参考: チューナーの目盛りと針を横一直線に置き換えたもの)
 */
function ReactionMeter({ ms }: { ms: number | null }) {
  const pos = ms == null ? null : Math.min(ms / METER_MAX_MS, 1) * 100;
  return (
    <div className="w-full max-w-sm" aria-hidden="true">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1.5 flex h-1 gap-1">
          <span className="flex-1 bg-correct" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-wrong" />
        </div>
        {pos != null && (
          <span className="absolute top-0 h-4 w-0.5 -translate-x-1/2 bg-ink" style={{ left: `${pos}%` }} />
        )}
      </div>
      <div className="mt-1 flex justify-between font-mono text-xs text-dim">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3s</span>
      </div>
    </div>
  );
}

function Reading({ label, value, unit, lit = false }: { label: ReactNode; value: string; unit?: ReactNode; lit?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-dim truncate">{label}</dt>
      <dd className={`whitespace-nowrap font-mono text-xl sm:text-3xl leading-tight ${lit ? 'text-accent' : 'text-ink'}`}>
        {value}
        {unit && <span className="ml-1 text-xs text-dim">{unit}</span>}
      </dd>
    </div>
  );
}

/** 練習画面の読み取り表示 = チューナーの窓 (docs/design-system/README.md「読み取り」) */
export function PracticeReadout({
  big,
  feedback,
  prompt,
  children,
  lastMs,
  avgMs,
  correct,
  total,
  progressLabel,
  progress,
}: PracticeReadoutProps) {
  const bigColor = big == null ? 'text-dim' : feedback === 'wrong' ? 'text-wrong' : 'text-accent';
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex items-center gap-4 rounded-lg bg-glass p-3 sm:gap-6 sm:p-6" role="status" aria-live="polite">
        <span className={`min-w-[1.5ch] shrink-0 text-center font-mono text-7xl font-medium leading-none sm:text-8xl ${bigColor}`}>
          {big ?? '?'}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-base font-semibold text-ink text-pretty">{prompt}</p>
          {children}
          <ReactionMeter ms={lastMs} />
        </div>
      </div>
      <dl className="grid grid-cols-4 gap-x-3 gap-y-3 lg:grid-cols-2 lg:content-center lg:gap-x-6">
        <Reading label="今回の反応" value={seconds(lastMs)} unit="秒" lit />
        <Reading label="平均反応" value={seconds(avgMs)} unit="秒" />
        <Reading label="正答" value={total > 0 ? `${correct}/${total}` : '—'} />
        <Reading label={progressLabel} value={progress} />
      </dl>
    </div>
  );
}
