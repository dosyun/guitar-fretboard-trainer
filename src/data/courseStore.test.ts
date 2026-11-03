import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BPM_STEPS, completeDay, gapBucket, gapForDay, getNextDay, loadCourse,
  nextBpm, saveCourse, startDay, updateDay,
} from './courseStore';
import type { CourseStore } from './courseStore';

class MemStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemStorage());
});
afterEach(() => vi.unstubAllGlobals());

describe('コース保存', () => {
  it('空の状態と全フィールドの往復', () => {
    expect(loadCourse()).toEqual({ version: 1, days: {} });
    saveCourse({
      version: 1,
      days: { 1: {
        startedAt: 100, completedAt: 200, hidden: { correct: 8, total: 10 },
        switchBpm: 72, switchOk: false, stalls: ['C>F:high'], looperClicked: true,
      } },
    });
    expect(loadCourse()).toEqual({
      version: 1,
      days: { 1: {
        startedAt: 100, completedAt: 200, hidden: { correct: 8, total: 10 },
        switchBpm: 72, switchOk: false, stalls: ['C>F:high'], looperClicked: true,
      } },
    });
  });

  it('壊れたJSONを空の状態にする', () => {
    localStorage.setItem('gft-course-v1', '{broken');
    expect(loadCourse()).toEqual({ version: 1, days: {} });
  });

  it.each([
    null, [], {}, { version: 2, days: {} }, { version: 1, days: [] },
    { version: 1, days: null }, { version: 1, days: { 6: { startedAt: 1 } } },
    { version: 1, days: { 1: {} } },
    { version: 1, days: { 1: { startedAt: '1' } } },
    { version: 1, days: { 1: { startedAt: 1, completedAt: null } } },
    { version: 1, days: { 1: { startedAt: 1, hidden: { correct: 11, total: 10 } } } },
    { version: 1, days: { 1: { startedAt: 1, hidden: { correct: 1 } } } },
    { version: 1, days: { 1: { startedAt: 1, switchBpm: 61 } } },
    { version: 1, days: { 1: { startedAt: 1, switchOk: 'yes' } } },
    { version: 1, days: { 1: { startedAt: 1, stalls: [1] } } },
    { version: 1, days: { 1: { startedAt: 1, looperClicked: 1 } } },
  ])('不正な形は全体を空に戻す: %j', (value) => {
    localStorage.setItem('gft-course-v1', JSON.stringify(value));
    expect(loadCourse()).toEqual({ version: 1, days: {} });
  });

  it('保存領域が利用不能でも読み書きは例外を出さない', () => {
    vi.stubGlobal('localStorage', {
      getItem() { throw new Error('unavailable'); },
      setItem() { throw new Error('quota'); },
    });
    expect(loadCourse()).toEqual({ version: 1, days: {} });
    expect(() => saveCourse({ version: 1, days: {} })).not.toThrow();
    expect(() => startDay(1, 100)).not.toThrow();
  });

  it('再開始・更新・完了でも初回startedAtと既存情報を残す', () => {
    startDay(1, 100);
    startDay(1, 200);
    updateDay(1, { switchBpm: 72, hidden: { correct: 9, total: 10 } }, 250);
    completeDay(1, 300);
    expect(loadCourse()).toEqual({
      version: 1,
      days: { 1: { startedAt: 100, completedAt: 300, switchBpm: 72, hidden: { correct: 9, total: 10 } } },
    });
  });

  it('開始前の更新や完了でも開始時刻を作る', () => {
    updateDay(2, { switchOk: false }, 400);
    completeDay(3, 500);
    expect(loadCourse().days).toEqual({
      2: { startedAt: 400, switchOk: false }, 3: { startedAt: 500, completedAt: 500 },
    });
  });

  it('未完了の最初の回を返し、全完了なら1に戻る', () => {
    expect(getNextDay()).toBe(1);
    completeDay(1, 0);
    expect(getNextDay()).toBe(2);
    completeDay(3, 300);
    expect(getNextDay()).toBe(2);
    for (const day of [2, 4, 5]) completeDay(day, 500);
    expect(getNextDay(loadCourse())).toBe(1);
  });
});

describe('ローカル暦日による間隔', () => {
  const local = (day: number, hour = 12, minute = 0) => new Date(2026, 2, day, hour, minute).getTime();

  it('未完了・同日・日付境界・1日・7日・8日を区別する', () => {
    expect(gapBucket(undefined, local(10))).toBe('none');
    expect(gapBucket(local(1, 1), local(1, 23))).toBe('same_day');
    expect(gapBucket(local(1, 23, 59), local(2, 0, 1))).toBe('1-7d');
    expect(gapBucket(local(1), local(2))).toBe('1-7d');
    expect(gapBucket(local(1), local(8))).toBe('1-7d');
    expect(gapBucket(local(1), local(9))).toBe('8d+');
    // 夏時間の切り替えがある地域でも7暦日は同じ帯。
    expect(gapBucket(local(5), local(12))).toBe('1-7d');
  });

  it('第1回はnone、第2回は第1回の完了時刻を使う', () => {
    const store: CourseStore = {
      version: 1, days: { 1: { startedAt: local(1), completedAt: local(1) } },
    };
    expect(gapForDay(1, store, local(9))).toBe('none');
    expect(gapForDay(2, store, local(9))).toBe('8d+');
    expect(gapForDay(3, store, local(9))).toBe('none');
  });
});

describe('次回の初期BPM', () => {
  it('情報なしなら60、成功時だけ1段上げ、84で止める', () => {
    expect(BPM_STEPS).toEqual([60, 72, 84]);
    expect(nextBpm({ version: 1, days: {} }, 1)).toBe(60);
    expect(nextBpm({ version: 1, days: {} }, 5)).toBe(60);
    const store: CourseStore = { version: 1, days: { 1: { startedAt: 0, switchBpm: 60, switchOk: true } } };
    expect(nextBpm(store, 2)).toBe(72);
    store.days[1].switchBpm = 72;
    expect(nextBpm(store, 2)).toBe(84);
    store.days[1].switchBpm = 84;
    expect(nextBpm(store, 2)).toBe(84);
    store.days[1].switchOk = false;
    store.days[1].switchBpm = 72;
    expect(nextBpm(store, 2)).toBe(72);
    delete store.days[1].switchOk;
    expect(nextBpm(store, 2)).toBe(72);
  });

  it('直前にBPMがなければ最後の先行回を使い、未来の回は使わない', () => {
    const store: CourseStore = {
      version: 1,
      days: {
        1: { startedAt: 0, switchBpm: 60, switchOk: true },
        2: { startedAt: 0 }, 4: { startedAt: 0, switchBpm: 84, switchOk: true },
      },
    };
    expect(nextBpm(store, 3)).toBe(72);
    expect(nextBpm(store, 1)).toBe(60);
    store.days[2] = { startedAt: 0, switchBpm: 72, switchOk: false };
    expect(nextBpm(store, 3)).toBe(72);
  });
});

it('再完了では初回完了と間隔を保持し、再完了時刻を別に保存する', () => {
  const first = new Date(2026, 10, 1, 12).getTime();
  const repeat = new Date(2026, 10, 10, 12).getTime();
  completeDay(1, first);
  completeDay(1, repeat);
  const progress = loadCourse();
  expect(progress.days[1].completedAt).toBe(first);
  expect(progress.days[1].lastCompletedAt).toBe(repeat);
  expect(gapForDay(2, progress, repeat)).toBe('8d+');
  expect(getNextDay(progress)).toBe(2);
});

it('ゼロの初回完了時刻も再完了で上書きしない', () => {
  completeDay(1, 0);
  completeDay(1, 123);
  expect(loadCourse().days[1]).toMatchObject({ completedAt: 0, lastCompletedAt: 123 });
});
