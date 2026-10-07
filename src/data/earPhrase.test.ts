import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMidiAt } from './fretboard';
import {
  createPhraseRng, generateEarPhrase, getPhraseDegreeLabels, getPhraseMotion,
  judgeEarPhrase, transposeEarPhrase,
} from './earPhrase';
import type { EarPhrase, PhraseLevel, PhraseRange } from './earPhrase';
import { getSkillMetrics, recordSkill } from './skillStore';
import { exportBackup, importBackup } from './backup';

const range: PhraseRange = { strings: [0, 1, 2, 3, 4, 5], fretRange: [0, 12] };
const cPhrase: EarPhrase = {
  level: 3, key: { root: 0, mode: 'major' },
  midis: [64, 67, 69, 67], degrees: [3, 5, 6, 5],
  positions: [{ string: 5, fret: 0 }, { string: 5, fret: 3 }, { string: 5, fret: 5 }, { string: 5, fret: 3 }],
};
afterEach(() => vi.unstubAllGlobals());

describe('耳トレのフレーズ再現', () => {
  it('同じseedで再現でき、各レベルの音数・音階上の跳躍・キー条件を守る', () => {
    const limits = [
      { level: 1, min: 2, max: 3, jump: 1, roots: [0], modes: ['major'] },
      { level: 2, min: 3, max: 3, jump: 2, roots: [0, 7, 5], modes: ['major'] },
      { level: 3, min: 4, max: 4, jump: 4, roots: Array.from({ length: 12 }, (_, i) => i), modes: ['major'] },
      { level: 4, min: 4, max: 5, jump: 7, roots: Array.from({ length: 12 }, (_, i) => i), modes: ['major', 'minor'] },
    ];
    for (const limit of limits) {
      const seenRoots = new Set<number>();
      const seenModes = new Set<string>();
      for (let seed = 0; seed < 128; seed += 1) {
        const options = { level: limit.level as PhraseLevel, range };
        const phrase = generateEarPhrase({ ...options, rng: createPhraseRng(Math.imul(seed, 2654435761)) });
        expect(phrase).not.toBeNull();
        expect(phrase).toEqual(generateEarPhrase({ ...options, rng: createPhraseRng(Math.imul(seed, 2654435761)) }));
        const result = phrase!;
        expect(result.midis.length).toBeGreaterThanOrEqual(limit.min);
        expect(result.midis.length).toBeLessThanOrEqual(limit.max);
        expect(limit.roots).toContain(result.key.root);
        expect(limit.modes).toContain(result.key.mode);
        seenRoots.add(result.key.root);
        seenModes.add(result.key.mode);
        const scale = result.key.mode === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
        const ranks = result.midis.map((midi) => {
          const offset = midi - result.key.root;
          const index = scale.indexOf(((offset % 12) + 12) % 12);
          expect(index).toBeGreaterThanOrEqual(0);
          return Math.floor(offset / 12) * 7 + index;
        });
        for (let i = 1; i < ranks.length; i += 1) {
          const distance = Math.abs(ranks[i] - ranks[i - 1]);
          expect(distance).toBeLessThanOrEqual(limit.jump);
          if (limit.level === 1) expect(distance).toBe(1);
        }
        expect(new Set(result.midis).size).toBeGreaterThan(1);
      }
      expect([...seenRoots].sort((a, b) => a - b)).toEqual([...limit.roots].sort((a, b) => a - b));
      expect([...seenModes].sort()).toEqual([...limit.modes].sort());
    }
  });

  it('指定した弦・フレット・音名だけで弾ける音を生成し、狭すぎる範囲では出題しない', () => {
    const restricted: PhraseRange = { strings: [2, 3], fretRange: [2, 5], notes: [0, 2, 4, 5, 7, 9, 11] };
    for (const level of [1, 2, 3, 4] as const) {
      const phrase = generateEarPhrase({ level, range: restricted, rng: createPhraseRng(level) });
      expect(phrase).not.toBeNull();
      for (const [index, pos] of phrase!.positions.entries()) {
        expect(restricted.strings).toContain(pos.string);
        expect(pos.fret).toBeGreaterThanOrEqual(2);
        expect(pos.fret).toBeLessThanOrEqual(5);
        expect(restricted.notes).toContain(phrase!.midis[index] % 12);
        expect(getMidiAt(pos.string, pos.fret)).toBe(phrase!.midis[index]);
      }
    }
    expect(generateEarPhrase({ level: 1, range: { strings: [5], fretRange: [0, 0] } })).toBeNull();
    expect(generateEarPhrase({ level: 2, range: { strings: [], fretRange: [0, 12] } })).toBeNull();
  });

  it('同じ実音の別ポジションを正解にし、オクターブ許容は設定に従う', () => {
    expect(judgeEarPhrase([64, 67], [getMidiAt(4, 5), getMidiAt(3, 12)], false)).toBe(true);
    expect(judgeEarPhrase([64, 67], [52, 79], true)).toBe(true);
    expect(judgeEarPhrase([64, 67], [52, 79], false)).toBe(false);
    expect(judgeEarPhrase([64, 67], [64, 68], true)).toBe(false);
    expect(judgeEarPhrase([64, 67], [64], true)).toBe(false);
  });

  it('キーに対する度数と音の動きを表示する', () => {
    expect(getPhraseDegreeLabels(cPhrase)).toEqual(['3', '5', '6', '5']);
    expect(getPhraseDegreeLabels({ ...cPhrase, key: { root: 7, mode: 'major' } })).toEqual(['6', '1', '2', '1']);
    expect(getPhraseDegreeLabels({ ...cPhrase, key: { root: 9, mode: 'minor' } })).toEqual(['5', 'b7', '1', 'b7']);
    expect(getPhraseMotion([64, 67, 67, 62])).toEqual(['up', 'same', 'down']);
  });

  it('別キーに移しても度数の並びと旋律を保ち、範囲で弾けない移調は返さない', () => {
    const result = transposeEarPhrase(cPhrase, range, createPhraseRng(9));
    expect(result).not.toBeNull();
    expect(result!.key.root).not.toBe(0);
    expect(getPhraseDegreeLabels(result!)).toEqual(['3', '5', '6', '5']);
    expect(result!.degrees).toEqual([3, 5, 6, 5]);
    const shift = result!.midis[0] - 64;
    expect(result!.midis).toEqual([64 + shift, 67 + shift, 69 + shift, 67 + shift]);
    for (const [index, pos] of result!.positions.entries()) {
      expect(range.strings).toContain(pos.string);
      expect(pos.fret).toBeGreaterThanOrEqual(0);
      expect(pos.fret).toBeLessThanOrEqual(12);
      expect(getMidiAt(pos.string, pos.fret)).toBe(result!.midis[index]);
    }
    expect(transposeEarPhrase(cPhrase, { strings: [5], fretRange: [0, 0] })).toBeNull();
  });

  it('古い成績を保ち、ヒント・再生回数を含むフレーズ項目を同じ保存キーに追加する', () => {
    const values = new Map([['gft-skills-v1', JSON.stringify({ ear: { n: 4, correct: 3 }, note: { n: 8, correct: 6 } })]]);
    vi.stubGlobal('localStorage', {
      get length() { return values.size; },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    expect(getSkillMetrics().find(({ id }) => id === 'ear')).toMatchObject({ n: 4, accuracy: 0.75 });
    const detail = {
      level: 3 as const, hintLevel: 2 as const, playCount: 4, key: { root: 0, mode: 'major' as const },
      midis: [64, 67, 69, 67], answer: [64, 67, 69, 67], responseTimeMs: 2345, allowOctave: false,
    };
    recordSkill('ear-phrase', true, detail);
    recordSkill('ear-phrase', false, { ...detail, hintLevel: 0, answer: [64, 67, 68, 67] });
    recordSkill('ear', true);
    const saved = JSON.parse(values.get('gft-skills-v1')!);
    expect(saved.note).toEqual({ n: 8, correct: 6 });
    expect(saved.ear).toEqual({ n: 5, correct: 4 });
    expect(saved['ear-phrase']).toEqual({
      n: 2, correct: 1,
      phraseAttempts: [{ ...detail, correct: true }, { ...detail, hintLevel: 0, answer: [64, 67, 68, 67], correct: false }],
    });
    const backup = exportBackup(123);
    values.clear();
    expect(importBackup(backup)).toEqual({ ok: true });
    expect(JSON.parse(values.get('gft-skills-v1')!)).toEqual(saved);
    values.set('gft-skills-v1', JSON.stringify({
      ...saved,
      'ear-phrase': {
        n: 2000, correct: 2000, legacyField: 'preserved',
        phraseAttempts: Array.from({ length: 2000 }, (_, playCount) => ({ ...detail, playCount, correct: true })),
      },
    }));
    recordSkill('ear-phrase', true, { ...detail, playCount: 2000 });
    const bounded = JSON.parse(values.get('gft-skills-v1')!)['ear-phrase'];
    expect(bounded.phraseAttempts).toHaveLength(2000);
    expect(bounded.phraseAttempts[0].playCount).toBe(1);
    expect(bounded.phraseAttempts[1999].playCount).toBe(2000);
    expect(bounded.legacyField).toBe('preserved');
  });
});
