import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PHASES, computePhaseStatus } from './phases';
import { getMidiAt, getNoteAt, INTERVAL_NAMES } from './fretboard';
import { exportBackup, importBackup } from './backup';
import { recordAttempt, getCellStats } from './practiceStore';
import {
  degreeOf, explainAnswer, generateDegreeQuestion, getNextStage, getStageProgress,
  getStageStatus, markStageSeen, passesStage, readStageProgress, saveStageResult, STAGE_PROGRESS_KEY,
} from './stageTutorial';

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  clear() { this.values.clear(); }
}
beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()));
afterEach(() => vi.unstubAllGlobals());
function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('stage definitions and note explanations', () => {
  it('keeps six note stages followed by five unique degree stages', () => {
    expect(PHASES).toHaveLength(11);
    expect(new Set(PHASES.map((p) => p.id)).size).toBe(11);
    expect(PHASES.map((p) => p.id)).toEqual([
      'open-strings', 'string6-naturals', 'string5-naturals', 'fret5-bridge',
      'octave-shape', 'sharps-flats', 'deg-power', 'deg-fourth', 'deg-thirds', 'deg-rest', 'deg-cross',
    ]);
    expect(PHASES.map((p) => p.kind)).toEqual([...Array(6).fill('note'), ...Array(5).fill('degree')]);
  });
  it('ends every note route with the actual answer in both spellings', () => {
    for (const stage of PHASES.filter((p) => p.kind === 'note')) {
      for (const string of stage.strings) {
        for (let fret = stage.fretRange[0]; fret <= stage.fretRange[1]; fret++) {
          if (stage.notes && !stage.notes.includes(getNoteAt(string, fret))) continue;
          for (const accidental of ['sharp', 'flat'] as const) {
            const result = explainAnswer(stage.id, { string, fret }, undefined, accidental);
            expect(result.endsWith(getNoteAt(string, fret, accidental))).toBe(true);
            expect(result.length).toBeGreaterThan(1);
          }
        }
      }
    }
  });
  it('points to the next thinner string with the G-to-B exception', () => {
    for (const string of [0, 1, 2, 4]) {
      const route = explainAnswer('fret5-bridge', { string, fret: 5 });
      expect(route).toContain('(' + (5 - string) + '弦)');
      expect(getNoteAt(string, 5)).toBe(getNoteAt(string + 1, 0));
    }
    expect(explainAnswer('fret5-bridge', { string: 3, fret: 4 })).toContain('(2弦)の開放音 B');
  });
  it('uses an actual octave source and the correct B-string shift', () => {
    for (let string = 2; string < 6; string++) {
      for (let fret = string >= 4 ? 3 : 2; fret <= 12; fret++) {
        const route = explainAnswer('octave-shape', { string, fret });
        const source = /^(\d)弦(\d+)F/.exec(route)!;
        expect(source).not.toBeNull();
        const sourceMidi = getMidiAt(6 - Number(source[1]), Number(source[2]));
        expect(getMidiAt(string, fret) - sourceMidi).toBe(12);
      }
    }
  });
});

describe('degree generation', () => {
  it('replays the same seed and validates 1,000 questions for every degree stage', () => {
    for (const stage of PHASES.filter((p) => p.kind === 'degree')) {
      const first = seeded(42);
      const second = seeded(42);
      const found = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const q = generateDegreeQuestion(stage, first);
        expect(q).toEqual(generateDegreeQuestion(stage, second));
        expect([0, 1]).toContain(q.rootPosition.string);
        expect(q.rootPosition.fret).toBeGreaterThanOrEqual(3);
        expect(q.rootPosition.fret).toBeLessThanOrEqual(8);
        expect(q.position).not.toEqual(q.rootPosition);
        expect(q.position.fret).toBeGreaterThanOrEqual(q.rootPosition.fret - 3);
        expect(q.position.fret).toBeLessThanOrEqual(q.rootPosition.fret + 4);
        expect(q.position.fret).toBeGreaterThanOrEqual(0);
        expect(q.position.fret).toBeLessThanOrEqual(12);
        expect(stage.degrees).toContain(q.degree);
        expect(stage.id === 'deg-cross' ? [4, 5] : [q.rootPosition.string,
          q.rootPosition.string + 1, q.rootPosition.string + 2]).toContain(q.position.string);
        const semitones = ((getMidiAt(q.position.string, q.position.fret) -
          getMidiAt(q.rootPosition.string, q.rootPosition.fret)) % 12 + 12) % 12;
        expect(q.degree).toBe(INTERVAL_NAMES[semitones]);
        expect(degreeOf(q.position, q.rootPosition)).toBe(q.degree);
        const explanation = explainAnswer(stage.id, q.position, q.rootPosition);
        expect(explanation.startsWith(q.degree + ' = ')).toBe(true);
        expect(explanation.endsWith(q.degree)).toBe(true);
        expect(explanation).toContain('ルートから' + semitones + '半音');
        if (stage.id === 'deg-cross') expect(explanation).toContain('2弦をまたいだので1フレット右');
        found.add(q.degree);
      }
      expect([...found].sort()).toEqual([...stage.degrees].sort());
      expect(() => generateDegreeQuestion(stage, () => 0)).not.toThrow();
    }
  });
});

describe('stage progress and backup compatibility', () => {
  it('requires exactly ten answers, at least nine correct, and the target speed', () => {
    const stage = PHASES[0];
    expect(passesStage(stage, 9, stage.targetMs)).toBe(true);
    expect(passesStage(stage, 10, stage.targetMs)).toBe(true);
    for (const [correct, ms, count] of [[8, 1, 10], [9, stage.targetMs + 1, 10],
      [9, 1, 9], [11, 1, 10], [9, NaN, 10], [9, -1, 10]]) {
      expect(passesStage(stage, correct, ms, count)).toBe(false);
    }
  });
  it('keeps best-score speed together and records a later faster passing result', () => {
    const id = PHASES[0].id;
    markStageSeen(id, 1);
    saveStageResult(id, 10, 3000, 10, 2);
    expect(getStageStatus(PHASES[0]).clear).toBe(false);
    saveStageResult(id, 9, 1000, 10, 3);
    expect(getStageProgress(id)).toEqual({ seenAt: 1, bestCorrect: 10, bestAvgMs: 3000, clearedAt: 3 });
    saveStageResult(id, 10, 1900, 10, 4);
    saveStageResult(id, 1, 1, 3, 5);
    expect(getStageProgress(id)).toEqual({ seenAt: 1, bestCorrect: 10, bestAvgMs: 1900, clearedAt: 3 });
    expect(getNextStage('note')?.id).toBe('string6-naturals');
  });
  it('recognizes every legacy note stage with three mastered trials per cell', () => {
    const cells: Record<string, { n: number; correct: number; sumMs: number; lastAt: number }> = {};
    for (let string = 0; string < 6; string++) {
      for (let fret = 0; fret <= 12; fret++) {
        cells['position-to-note:' + string + ':' + fret] = { n: 3, correct: 3, sumMs: 3000, lastAt: 1 };
      }
    }
    localStorage.setItem('gft-cellstats-v1', JSON.stringify(cells));
    for (const stage of PHASES.filter((p) => p.kind === 'note')) {
      expect(computePhaseStatus(stage).clear).toBe(true);
      expect(getStageStatus(stage).clear).toBe(true);
    }
    expect(getStageStatus(PHASES[6]).clear).toBe(false);
    cells['position-to-note:0:0'].n = 2;
    cells['position-to-note:0:0'].correct = 2;
    localStorage.setItem('gft-cellstats-v1', JSON.stringify(cells));
    expect(getStageStatus(PHASES[0]).clear).toBe(false);
  });
  it('round-trips stage progress and accepts old backups without erasing grades', () => {
    recordAttempt({ id: 'a', sessionId: 's', quizType: 'position-to-note', isCorrect: true,
      responseTimeMs: 1000, string: 0, fret: 0, createdAt: 1 });
    const cells = getCellStats();
    localStorage.setItem('gft-sessions-v1', '[{"id":"existing","count":10,"correct":8}]');
    const old = exportBackup(1);
    markStageSeen('open-strings', 2);
    saveStageResult('open-strings', 9, 1000, 10, 3);
    const backup = exportBackup(4);
    expect(backup.data[STAGE_PROGRESS_KEY]).toBeDefined();
    localStorage.clear();
    expect(importBackup(backup).ok).toBe(true);
    expect(getStageProgress('open-strings').clearedAt).toBe(3);
    localStorage.clear();
    expect(importBackup(old).ok).toBe(true);
    expect(readStageProgress()).toEqual({});
    expect(getCellStats()).toEqual(cells);
    expect(localStorage.getItem('gft-sessions-v1')).toBe(old.data['gft-sessions-v1']);
    localStorage.setItem(STAGE_PROGRESS_KEY, '{broken');
    expect(readStageProgress()).toEqual({});
    localStorage.setItem(STAGE_PROGRESS_KEY, '{"open-strings":{"bestCorrect":-1,"bestAvgMs":"bad","clearedAt":"bad"}}');
    expect(getStageStatus(PHASES[0]).clear).toBe(false);
    expect(getStageProgress('open-strings').bestCorrect).toBeNull();
  });
});
