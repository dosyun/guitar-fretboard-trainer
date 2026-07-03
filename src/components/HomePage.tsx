import { Segmented } from 'antd';
import { getOverallStats, getNoteRecognitionMetrics, getStreak } from '../data/practiceStore';
import { getCompletedLessons } from '../data/lessonProgress';
import { LESSONS } from '../data/lessons';
import { getNoteLabel } from '../data/fretboard';
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
    <div className="max-w-md mx-auto w-full space-y-5">
      <InstallPrompt />

      <div className="flex items-center justify-between">
        <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
          <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
          HOME
        </div>
        {streak > 0 && (
          <span className="text-xs text-dim">
            連続 <span className="font-mono tabular-nums text-accent">{streak}</span> 日
          </span>
        )}
      </div>

      {/* 目的に合わせたおすすめ（オンボーディングで選択） */}
      {goal && (
        <div className="bg-surface border border-accent rounded-2xl p-5 space-y-3">
          <div>
            <div className="text-xs text-dim">あなたの目標</div>
            <h2 className="text-lg font-bold text-ink text-balance">{goal.label}</h2>
            <p className="text-dim text-sm mt-1 text-pretty">{goal.hint}</p>
          </div>
          <button
            onClick={() => onStartGoal(goal)}
            className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            {goal.cta}
          </button>
          <button onClick={() => onLearn(goal.lessonId)} className="w-full text-sm text-accent hover:opacity-80 transition-opacity">
            この目標を学ぶ →
          </button>
        </div>
      )}

      {/* 今日の練習（習慣化） */}
      <div className="bg-surface border border-hair rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink text-balance">今日の練習</h2>
          <p className="text-dim text-sm mt-1 text-pretty">
            あなたの弱点を優先して{dailyLength}問。指板の音名を反射で言えるように。
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-dim">問題数</span>
          <Segmented
            size="small"
            value={dailyLength}
            onChange={(v) => onDailyLengthChange(v as number)}
            options={[
              { label: '10', value: 10 },
              { label: '15', value: 15 },
              { label: '20', value: 20 },
            ]}
          />
        </div>
        <button
          onClick={onStartDaily}
          className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
        >
          今日の{dailyLength}問をはじめる
        </button>
        <button
          onClick={onStartPractice}
          className="w-full text-sm text-dim hover:text-ink transition-colors"
        >
          チャレンジ（全範囲からランダムに腕試し）
        </button>
        {nextLesson ? (
          <button
            onClick={() => onLearn(nextLesson.id)}
            className="w-full flex items-center justify-between gap-2 text-sm text-accent hover:opacity-80 transition-opacity"
          >
            <span className="truncate">
              {lessonsDone === 0 ? '音楽理論を学ぶ（ゼロから）' : `次のレッスン: ${nextLesson.title}`} →
            </span>
            <span className="font-mono text-dim shrink-0">{lessonsDone}/{lessonsTotal}</span>
          </button>
        ) : (
          <button onClick={() => onLearn()} className="w-full text-sm text-accent hover:opacity-80 transition-opacity">
            🎉 理論コース制覇 ・ 復習する →
          </button>
        )}
      </div>

      {/* 進捗（Home=次の一手。数字の詳細は成績タブに集約） */}
      {hasData ? (
        <div className="space-y-3">
          {/* 成長が見える単一指標のみ。累計/正答率/平均の内訳は成績で */}
          <MasteryBar maxFret={maxFret} accidental={accidental} compact />

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

      {/* 学習マップ（フェーズ） */}
      <PhaseMap onStartPhase={onStartPhase} />
    </div>
  );
}
