/**
 * 学習目的（オンボーディングで選択）。目的に応じてHomeのおすすめ練習/レッスンを変える。
 * 「アドリブしたい人に音名クイズだけ」を避け、刺さる入口を出す。
 */
import type { QuizMode } from '../types';

export type GoalId = 'note' | 'chord' | 'improv' | 'compose';
export type GoalPracticeMode = 'basic' | 'chord-tone' | 'progression' | 'triad' | 'key-func' | 'ear';

export interface Goal {
  id: GoalId;
  label: string;
  desc: string;
  practiceMode: GoalPracticeMode;
  basicMode?: QuizMode; // practiceMode==='basic' のとき
  lessonId: string; // 最初のおすすめレッスン
  cta: string; // Homeのおすすめボタン文言
  hint: string;
}

export const GOALS: Goal[] = [
  {
    id: 'note',
    label: '指板の音名を覚えたい',
    desc: 'どこが何の音か、即答できるように',
    practiceMode: 'basic',
    basicMode: 'position-to-note',
    lessonId: 'notes',
    cta: '音名の練習をはじめる',
    hint: 'まずは指板の地図から。6弦・5弦→全弦へ。',
  },
  {
    id: 'chord',
    label: 'コードの仕組みを理解したい',
    desc: 'コードを“覚える”人から“作れる”人へ',
    practiceMode: 'triad',
    lessonId: 'triad',
    cta: 'トライアドを作る',
    hint: 'R・3・5でコードを組み立て、maj↔minの違いを掴む。',
  },
  {
    id: 'improv',
    label: 'アドリブできるようになりたい',
    desc: 'コードトーンを追ってチェンジに乗る',
    practiceMode: 'chord-tone',
    lessonId: 'degree',
    cta: 'コードトーン練習をはじめる',
    hint: '度数とコードトーンが鍵。3rd・7thを狙えると一気に化ける。',
  },
  {
    id: 'compose',
    label: '作曲・耳コピに強くなりたい',
    desc: 'キーの中での役割と進行を掴む',
    practiceMode: 'key-func',
    lessonId: 'diatonic',
    cta: 'キー機能の練習をはじめる',
    hint: 'IはどれでVはどれか。役割が分かると曲の構造が見える。',
  },
];

const KEY = 'gft-goal-v1';

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return false;
  }
}

export function getGoalId(): GoalId | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v !== 'skip' ? (v as GoalId) : null;
  } catch {
    return null;
  }
}

export function getGoal(): Goal | null {
  const id = getGoalId();
  return id ? GOALS.find((g) => g.id === id) ?? null : null;
}

export function setGoal(id: GoalId | 'skip'): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

/** オンボーディングをやり直す（設定から目的を変更）。 */
export function resetOnboarding(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
