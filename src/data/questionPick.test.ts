import { describe, it, expect, beforeEach } from 'vitest';
import {
  pickFresh, pickOtherThan, EMPTY_FOUND, foundForQuestion, isFoundAgain, addFound,
} from './questionPick';
import { recordAttempt, pickWeightedPosition } from './practiceStore';
import type { FretPosition } from '../types';

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
});

const ALL_STRINGS = [0, 1, 2, 3, 4, 5];
const key = (p: FretPosition) => `p:${p.string}:${p.fret}`;

function recordCell(string: number, fret: number, isCorrect: boolean, id: string) {
  recordAttempt({
    id, sessionId: 's1', quizType: 'position-to-note', isCorrect,
    responseTimeMs: 5000, string, fret, createdAt: Date.now(),
  });
}

describe('pickFresh — 直前と同じ問題を出さない', () => {
  it('ほぼ同じ問題しか返さない生成器でも、直前の問題は避ける', () => {
    // 95% の確率で "A" を返す（記録の少ない序盤の弱点出題と同じ偏り）。避けたい一覧に入っていれば外す。
    const biased = (avoid: ReadonlySet<string>) => (!avoid.has('A') && Math.random() < 0.95 ? 'A' : 'B');
    for (let i = 0; i < 300; i++) {
      expect(pickFresh(biased, (q) => q, ['A'])).toBe('B');
    }
  });

  it('候補が1つしかないときは同じ問題を返す（避けようがない）', () => {
    expect(pickFresh(() => 'A', (q) => q, ['A'])).toBe('A');
  });

  it('避けたい問題の一覧を生成器に渡す', () => {
    const seen: string[][] = [];
    pickFresh((avoid) => { seen.push([...avoid]); return 'C'; }, (q) => q, ['A', 'B']);
    expect(seen[0]).toEqual(['A', 'B']);
  });
});

describe('弱点優先の出題 — 記録のあるセルが1つだけの序盤（2026-11-10 本番で再現した不具合）', () => {
  it('記録のあるセルが直前の問題なら、続けて同じセルを出さない', () => {
    // 3弦5F（string=3, fret=5）を一度間違えた直後。記録はこのセルだけ。
    recordCell(3, 5, false, 'a1');
    const last = 'p:3:5';
    for (let i = 0; i < 300; i++) {
      const q = pickFresh(
        (avoid) => pickWeightedPosition('position-to-note', ALL_STRINGS, [0, 12], null, 'flat', (p) => avoid.has(key(p)))
          ?? { string: Math.floor(Math.random() * 6), fret: Math.floor(Math.random() * 13) },
        key,
        [last],
      );
      expect(key(q)).not.toBe(last);
    }
  });

  it('除外したセルは弱点の候補から外れ、残りの記録のあるセルから選ぶ', () => {
    recordCell(3, 5, false, 'a1');
    recordCell(0, 1, false, 'a2');
    for (let i = 0; i < 200; i++) {
      const p = pickWeightedPosition('position-to-note', ALL_STRINGS, [0, 12], null, 'flat', (c) => c.string === 3 && c.fret === 5);
      expect(p).not.toBeNull();
      expect(key(p!)).not.toBe('p:3:5');
    }
  });

  it('記録のあるセルがすべて除外されたら null（呼び出し側で一様ランダム）', () => {
    recordCell(3, 5, false, 'a1');
    expect(pickWeightedPosition('position-to-note', ALL_STRINGS, [0, 12], null, 'flat', (c) => c.string === 3 && c.fret === 5)).toBeNull();
  });
});

describe('pickOtherThan', () => {
  it('候補が2つ以上あれば直前と違うものを返す', () => {
    for (let i = 0; i < 200; i++) expect(pickOtherThan(['C', 'A', 'G', 'E', 'D'], 'C')).not.toBe('C');
  });
  it('候補が1つなら同じものを返す', () => {
    expect(pickOtherThan(['C'], 'C')).toBe('C');
  });
});

describe('1音ドリル — 答え済みの場所の押し直しを数えない', () => {
  it('同じ音が続く間は、答えた場所を押し直しても数えない', () => {
    let found = foundForQuestion(EMPTY_FOUND, 'C');
    found = addFound(found, 'C', '3:5', ['3:5', '4:1', '1:3']);
    found = foundForQuestion(found, 'C'); // 次の問題も C
    expect(isFoundAgain(found, 'C', '3:5')).toBe(true);
    expect(isFoundAgain(found, 'C', '4:1')).toBe(false);
  });

  it('音が変わったら答え済みを忘れる', () => {
    let found = addFound(EMPTY_FOUND, 'C', '3:5', ['3:5', '4:1']);
    found = foundForQuestion(found, 'D');
    expect(isFoundAgain(found, 'D', '3:5')).toBe(false);
    expect(found.cells).toEqual([]);
  });

  it('練習範囲内の場所をすべて答えたら、最初から数え直す', () => {
    let found = addFound(EMPTY_FOUND, 'C', '3:5', ['3:5', '4:1']);
    found = addFound(found, 'C', '4:1', ['3:5', '4:1']);
    expect(found.cells).toEqual([]);
    expect(isFoundAgain(found, 'C', '3:5')).toBe(false);
  });
});
