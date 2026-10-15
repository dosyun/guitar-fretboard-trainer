import type { ReactNode } from 'react';
import { Segmented } from 'antd';
import { getOverallStats, getNoteRecognitionMetrics, getStreak } from '../data/practiceStore';
import { getMasterySummary } from '../data/mastery';
import { getCompletedLessons } from '../data/lessonProgress';
import { LESSONS } from '../data/lessons';
import { getNoteLabel } from '../data/fretboard';
import { PhaseMap } from './PhaseMap';
import { InstallPrompt } from './InstallPrompt';
import { FretboardHeatmap } from './FretboardHeatmap';
import type { Phase } from '../data/phases';
import type { Goal } from '../data/goal';
import type { Accidental } from '../types';
import type { CellMetrics } from '../types/practice';

interface HomePageProps {
  accidental: Accidental;
  maxFret: number;
  dailyLength: number;
  goal: Goal | null;
  onStartGoal: (g: Goal) => void;
  onDailyLengthChange: (n: number) => void;
  onStartDaily: () => void;
  onStartPractice: () => void;
  onStartPhase: (p: Phase) => void;
  onOpenStats: () => void;
  onShowHelp: () => void;
  onLearn: (lessonId?: string) => void;
}

const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const weakness = (m: CellMetrics) =>
  0.6 * m.errorRate + 0.4 * clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));

function Reading({ label, value, unit }: { label: ReactNode; value: string; unit?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-dim">{label}</dt>
      <dd className="whitespace-nowrap font-mono text-xl text-ink sm:text-3xl">
        {value}
        {unit && <span className="ml-1 text-xs text-dim">{unit}</span>}
      </dd>
    </div>
  );
}

/** 「次にやること」の1行。左に項目名、中央に中身、右に操作 (カードではなく罫線で区切る) */
function NextRow({ label, children, actions }: { label: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <li className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <p className="text-xs text-dim">{label}</p>
      <div className="min-w-0 space-y-1">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{actions}</div>}
    </li>
  );
}

export function HomePage({ accidental, maxFret, dailyLength, goal, onStartGoal, onDailyLengthChange, onStartDaily, onStartPractice, onStartPhase, onOpenStats, onShowHelp, onLearn }: HomePageProps) {
  const metrics = getNoteRecognitionMetrics();
  const streak = getStreak();
  const overall = getOverallStats();
  const mastery = getMasterySummary(maxFret, accidental);
  const worst = [...metrics].filter((m) => m.n >= 2).sort((a, b) => weakness(b) - weakness(a))[0];
  const hasData = overall.count > 0;

  // 学ぶコースの続き（未完了の最初のレッスン）
  const doneLessons = getCompletedLessons();
  const lessonsTotal = LESSONS.length;
  const lessonsDone = doneLessons.size;
  const nextLesson = LESSONS.find((l) => !doneLessons.has(l.id)) ?? null;

  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-6 sm:space-y-8">
      <InstallPrompt />

      {/* 筐体: 今日の練習。読み取りの窓 (習熟度・連続・反応) と、問題数・開始のスイッチ */}
      <section aria-labelledby="daily-title" className="rounded-2xl border border-hair border-t-case-edge bg-surface p-3 sm:p-6">
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col justify-end gap-6 rounded-lg bg-glass p-4 sm:p-6">
            {/* 窓の主役: 自分の弱点を指板の上に (成績タブのヒートマップと同じ集計)。スマホでは数字だけ */}
            {hasData && (
              <div className="hidden overflow-x-auto sm:block">
                <FretboardHeatmap maxFret={maxFret} accidental={accidental} />
              </div>
            )}
            <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
            <div>
              <p className="text-xs text-dim">指板習熟度</p>
              <p className="font-mono text-7xl font-medium leading-none text-accent sm:text-8xl">
                {mastery.overall}
                <span className="ml-1 text-xl text-dim">%</span>
              </p>
            </div>
            <dl className="grid flex-1 grid-cols-3 gap-3 sm:gap-6">
              <Reading label="連続練習" value={String(streak)} unit="日" />
              <Reading label="平均反応" value={hasData ? (overall.avgMs / 1000).toFixed(2) : '—'} unit="秒" />
              <Reading label="回答数" value={String(overall.count)} />
            </dl>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 sm:p-2">
            <div className="space-y-1">
              <h1 id="daily-title" className="text-xl font-semibold text-ink">今日の練習</h1>
              <p className="text-sm text-dim">{`位置→音名を${dailyLength}問。間違えやすい場所と反応が遅い場所から先に出題します。`}</p>
            </div>
            <div className="space-y-2">
              <span className="block text-xs text-dim">今日の問題数</span>
              <Segmented block aria-label="今日の問題数" value={dailyLength} onChange={(v) => onDailyLengthChange(v as number)} options={[{ label: '10', value: 10 }, { label: '15', value: 15 }, { label: '20', value: 20 }]} />
            </div>
            <button onClick={onStartDaily} className="flex min-h-14 w-full items-center justify-center gap-4 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-bg hover:opacity-90">
              {`今日の${dailyLength}問をはじめる`} <span aria-hidden="true">→</span>
            </button>
            <button onClick={onStartPractice} className="min-h-12 text-sm text-dim hover:text-ink">
              自分で範囲を選んでチャレンジ <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="next-title">
        <h2 id="next-title" className="text-sm font-semibold text-ink">次にやること</h2>
        <ul className="mt-2 divide-y divide-hair border-y border-hair">
          {hasData ? (
            worst && (
              <NextRow
                label="次に向き合う場所"
                actions={<button onClick={onOpenStats} className="min-h-12 text-sm text-dim hover:text-ink">弱点を詳しく見る →</button>}
              >
                <p className="font-mono text-xl text-ink">
                  {6 - worst.pos.string}弦 {worst.pos.fret}F <span className="ml-2">{getNoteLabel(worst.pos.string, worst.pos.fret, accidental)}</span>
                </p>
              </NextRow>
            )
          ) : (
            <NextRow
              label="練習の手応え"
              actions={<button onClick={onShowHelp} className="min-h-12 text-sm text-dim hover:text-ink">使い方ガイドを開く <span aria-hidden="true">↗</span></button>}
            >
              <p className="text-base font-medium text-ink">まだ練習の記録がありません</p>
              <p className="text-sm text-dim">練習すると、得意な音と苦手な場所がここに見えてきます。</p>
            </NextRow>
          )}
          {goal && (
            <NextRow
              label="あなたの目標"
              actions={
                <>
                  <button onClick={() => onStartGoal(goal)} className="min-h-12 rounded-lg border border-hair bg-panel px-4 py-3 text-sm font-semibold text-ink hover:border-dim">{goal.cta} <span aria-hidden="true">→</span></button>
                  <button onClick={() => onLearn(goal.lessonId)} className="min-h-12 text-sm text-dim hover:text-ink">この目標を学ぶ <span aria-hidden="true">↗</span></button>
                </>
              }
            >
              <p className="text-base font-semibold text-ink">{goal.label}</p>
              <p className="text-sm text-dim">{goal.hint}</p>
            </NextRow>
          )}
          <NextRow
            label={<>学びの続き <span className="ml-1 font-mono">{lessonsDone}/{lessonsTotal}</span></>}
            actions={
              <button onClick={() => onLearn(nextLesson?.id)} className="min-h-12 text-sm text-dim hover:text-ink">
                {nextLesson ? (lessonsDone === 0 ? '最初のレッスンを開く' : '次のレッスンを開く') : 'レッスンを復習する'} <span aria-hidden="true">→</span>
              </button>
            }
          >
            <p className="text-base font-semibold text-ink">{nextLesson ? (lessonsDone === 0 ? '音楽理論をゼロから' : nextLesson.title) : '理論コースを完走しました'}</p>
            <p className="text-sm text-dim">{nextLesson ? `全${lessonsTotal}レッスン。指板で音を鳴らして確かめます。` : '全レッスンを完了しました。一覧から復習できます。'}</p>
            <div className="h-1 max-w-xs bg-glass" aria-hidden="true"><div className="h-full bg-dim" style={{ width: `${lessonsDone / lessonsTotal * 100}%` }} /></div>
          </NextRow>
        </ul>
      </section>

      <section className="min-w-0">
        <PhaseMap onStartPhase={onStartPhase} />
      </section>
    </div>
  );
}
