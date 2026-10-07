import { Segmented } from 'antd';
import { getOverallStats, getNoteRecognitionMetrics, getStreak } from '../data/practiceStore';
import { getCompletedLessons } from '../data/lessonProgress';
import { LESSONS } from '../data/lessons';
import { getNoteLabel } from '../data/fretboard';
import { BOARD, MARKER } from '../data/boardPalette';
import { PhaseMap } from './PhaseMap';
import { InstallPrompt } from './InstallPrompt';
import { MasteryBar } from './MasteryBar';
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

export function HomePage({ accidental, maxFret, dailyLength, goal, onStartGoal, onDailyLengthChange, onStartDaily, onStartPractice, onStartPhase, onOpenStats, onShowHelp, onLearn }: HomePageProps) {
  const metrics = getNoteRecognitionMetrics();
  const streak = getStreak();
  // 数字の詳細は成績タブに集約。Home では「データがあるか」の判定にだけ使う。
  const overall = getOverallStats();
  const worst = [...metrics].filter((m) => m.n >= 2).sort((a, b) => weakness(b) - weakness(a))[0];
  const hasData = overall.count > 0;

  // 学ぶコースの続き（未完了の最初のレッスン）
  const doneLessons = getCompletedLessons();
  const lessonsTotal = LESSONS.length;
  const lessonsDone = doneLessons.size;
  const nextLesson = LESSONS.find((l) => !doneLessons.has(l.id)) ?? null;

  return (
    <div className="mx-auto w-full max-w-screen-xl space-y-8">
      <InstallPrompt />
      <div className="relative">
        <div>
          <p className="mb-2 text-xs font-medium text-dim">毎日の練習室</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">指板を、直感で。</h1>
          <p className="mt-2 text-sm leading-relaxed text-dim">音を覚える。仕組みを知る。演奏につなげる。</p>
        </div>
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <span className="text-xs text-dim">連続練習</span>
          <span className="font-mono text-xs tabular-nums text-ink">{streak}<span className="ml-1 text-xs text-dim">日</span></span>
        </div>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <section aria-labelledby="daily-title" className="flex flex-col overflow-hidden rounded-2xl border border-hair bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-hair px-6 py-4">
            <span className="flex items-center gap-2 text-xs font-medium text-dim"><span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />今日のセッション</span>
            <span className="font-mono text-xs tabular-nums text-dim">01</span>
          </div>
          <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="daily-title" className="text-2xl font-semibold text-ink">今日の練習</h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-dim">指板の音名を、迷わず答える。<br />苦手な場所を優先して、少しずつ反応を速くしましょう。</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono text-3xl tabular-nums text-ink sm:text-4xl">{dailyLength}</span>
                <span className="ml-1 text-sm text-dim">問</span>
              </div>
            </div>
            <svg viewBox="0 0 640 112" className="w-full rounded-xl" aria-hidden="true">
              <rect width="640" height="112" rx="12" fill={BOARD.board} />
              {[80, 160, 240, 320, 400, 480, 560].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="112" stroke={BOARD.fretwire} strokeWidth="2" />)}
              {[16, 32, 48, 64, 80, 96].map((y, i) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke={BOARD.string} strokeWidth={0.7 + i * 0.25} />)}
              {[200, 360, 520].map((x) => <circle key={x} cx={x} cy="56" r="5" fill={BOARD.inlay} opacity="0.4" />)}
              <circle cx="280" cy="64" r="14" fill={MARKER.highlightBg} />
              <circle cx="440" cy="32" r="10" fill={BOARD.inlay} />
              <circle cx="120" cy="80" r="10" fill={BOARD.inlay} />
            </svg>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="block text-xs text-dim">今日の問題数</span>
                <Segmented aria-label="今日の問題数" value={dailyLength} onChange={(v) => onDailyLengthChange(v as number)} options={[{ label: '10', value: 10 }, { label: '15', value: 15 }, { label: '20', value: 20 }]} />
              </div>
              <button onClick={onStartDaily} className="flex min-h-12 w-full items-center justify-center gap-4 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg hover:opacity-90 sm:w-auto">
                {`今日の${dailyLength}問をはじめる`} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          <button onClick={onStartPractice} className="flex min-h-12 items-center justify-between gap-4 border-t border-hair px-6 py-4 text-left text-sm text-dim hover:bg-panel hover:text-ink sm:px-8">
            自分で範囲を選んでチャレンジ <span aria-hidden="true">↗</span>
          </button>
        </section>

        <div className="flex flex-col gap-4">
          {goal && (
            <section aria-labelledby="goal-title" className="flex-1 space-y-4 rounded-2xl border border-hair bg-surface p-6">
              <p className="text-xs text-dim">あなたの目標</p>
              <div>
                <h2 id="goal-title" className="text-lg font-semibold leading-snug text-ink">{goal.label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-dim">{goal.hint}</p>
              </div>
              <button onClick={() => onStartGoal(goal)} className="min-h-12 w-full rounded-xl border border-hair bg-panel px-4 py-3 text-sm font-semibold text-ink hover:bg-accent-soft">{goal.cta} <span aria-hidden="true">→</span></button>
              <button onClick={() => onLearn(goal.lessonId)} className="min-h-12 text-sm text-dim hover:text-ink">この目標を学ぶ <span aria-hidden="true">↗</span></button>
            </section>
          )}
          <section aria-labelledby="lesson-title" className="flex-1 space-y-4 rounded-2xl border border-hair bg-surface p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-dim">学びの続き</p>
              <span className="font-mono text-xs tabular-nums text-dim">{lessonsDone}/{lessonsTotal}</span>
            </div>
            <h2 id="lesson-title" className="text-lg font-semibold text-ink">{nextLesson ? (lessonsDone === 0 ? '音楽理論をゼロから' : nextLesson.title) : '理論コースを完走しました'}</h2>
            <p className="text-sm leading-relaxed text-dim">{nextLesson ? '見て、音を鳴らして、確かめる。わかったことを次の練習へ。' : '学んだことを振り返って、演奏に活かしましょう。'}</p>
            <div className="h-1 overflow-hidden rounded-full bg-panel" aria-hidden="true"><div className="h-full bg-accent" style={{ width: `${lessonsDone / lessonsTotal * 100}%` }} /></div>
            <button onClick={() => onLearn(nextLesson?.id)} className="flex min-h-12 w-full items-center justify-between text-left text-sm font-medium text-ink hover:text-accent">{nextLesson ? (lessonsDone === 0 ? '最初のレッスンを開く' : '次のレッスンを開く') : 'レッスンを復習する'}<span aria-hidden="true">→</span></button>
          </section>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <section className="min-w-0 lg:col-span-2">
          <PhaseMap onStartPhase={onStartPhase} />
        </section>
        <section aria-labelledby="progress-title" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id="progress-title" className="text-base font-semibold text-ink">練習の手応え</h2>
            <button onClick={onOpenStats} className="min-h-12 text-xs text-dim hover:text-ink">成績を見る <span aria-hidden="true">↗</span></button>
          </div>
          {hasData ? (
            <>
              <MasteryBar maxFret={maxFret} accidental={accidental} compact />
              {worst && (
                <button onClick={onOpenStats} className="w-full space-y-3 rounded-xl border border-hair bg-surface p-4 text-left hover:bg-panel">
                  <span className="block text-xs text-dim">次に向き合う場所</span>
                  <span className="block font-mono text-lg text-ink">{6 - worst.pos.string}弦 {worst.pos.fret}F <span className="text-accent">{getNoteLabel(worst.pos.string, worst.pos.fret, accidental)}</span></span>
                  <span className="block text-xs text-dim">弱点を詳しく見る →</span>
                </button>
              )}
            </>
          ) : (
            <div className="space-y-4 rounded-2xl border border-hair bg-surface p-6">
              <span className="font-mono text-3xl text-dim" aria-hidden="true">—</span>
              <h3 className="text-base font-medium text-ink">最初の記録をつくろう</h3>
              <p className="text-sm leading-relaxed text-dim">練習すると、得意な音と苦手な場所がここに見えてきます。</p>
              <button onClick={onShowHelp} className="min-h-12 text-sm text-ink hover:text-accent">使い方ガイドを開く <span aria-hidden="true">↗</span></button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
