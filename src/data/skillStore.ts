/**
 * スキルマップ用の per-skill 集計（localStorage）。
 * 練習エンジン（位置/度数）とは別に、スキル種別ごとの正答率を持ち、
 * 「音名/度数/トライアド/コードトーン/進行/キー機能」の習熟を横断表示する。
 */
import type { PhraseKey, PhraseLevel } from './earPhrase';

const KEY = 'gft-skills-v1';
const MAX_PHRASE_ATTEMPTS = 2000;

export type SkillId = 'note' | 'degree' | 'triad' | 'chordtone' | 'progression' | 'guidetone' | 'keyfunc' | 'ear' | 'ear-phrase';

export interface PhraseSkillAttempt {
  level: PhraseLevel;
  hintLevel: 0 | 1 | 2 | 3;
  playCount: number;
  key: PhraseKey;
  midis: number[];
  answer: number[];
  responseTimeMs: number;
  allowOctave: boolean;
}

export interface SkillStat {
  n: number;
  correct: number;
  phraseAttempts?: (PhraseSkillAttempt & { correct: boolean })[];
}
export type SkillMap = Partial<Record<SkillId, SkillStat>>;

export const SKILL_META: { id: SkillId; label: string }[] = [
  { id: 'note', label: '音名認識' },
  { id: 'degree', label: '度数' },
  { id: 'triad', label: 'トライアド' },
  { id: 'chordtone', label: 'コードトーン' },
  { id: 'progression', label: '進行' },
  { id: 'guidetone', label: 'ガイド音' },
  { id: 'keyfunc', label: 'キー機能' },
  { id: 'ear', label: '耳（聴き分け）' },
  { id: 'ear-phrase', label: '耳（フレーズ再現）' },
];

function load(): SkillMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SkillMap) : {};
  } catch {
    return {};
  }
}

export function recordSkill(id: SkillId, correct: boolean, phrase?: PhraseSkillAttempt): void {
  const map = load();
  const cur = map[id] ?? { n: 0, correct: 0 };
  map[id] = {
    ...cur,
    n: cur.n + 1,
    correct: cur.correct + (correct ? 1 : 0),
    ...(phrase ? { phraseAttempts: [...(cur.phraseAttempts ?? []), {
      ...phrase, key: { ...phrase.key }, midis: [...phrase.midis], answer: [...phrase.answer], correct,
    }].slice(-MAX_PHRASE_ATTEMPTS) } : {}),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export interface SkillMetric {
  id: SkillId;
  label: string;
  n: number;
  accuracy: number; // 0-1
}

/** スキルごとの正答率（出題済みのみ n>0、未出題は n=0 で返す）。 */
export function getSkillMetrics(): SkillMetric[] {
  const map = load();
  return SKILL_META.map(({ id, label }) => {
    const s = map[id];
    return {
      id,
      label,
      n: s?.n ?? 0,
      accuracy: s && s.n > 0 ? s.correct / s.n : 0,
    };
  });
}

export function clearSkills(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
