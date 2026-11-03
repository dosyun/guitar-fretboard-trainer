import { describe, expect, it } from 'vitest';
import { buildBeatSchedule } from './beatSchedule';

describe('拍の予定', () => {
  it('60BPMは1秒間隔で、カウント後に2小節ずつ切り替える', () => {
    const beats = buildBeatSchedule({ startTime: 10, bpm: 60, progression: ['C', 'F'] });
    expect(beats).toHaveLength(20);
    expect(beats.slice(0, 5).map((b) => b.time)).toEqual([10, 11, 12, 13, 14]);
    expect(beats.slice(0, 4).map((b) => b.chord)).toEqual([null, null, null, null]);
    expect(beats.slice(0, 4).map((b) => b.nextChord)).toEqual(['C', 'C', 'C', 'C']);
    expect(beats.slice(0, 4).every((b) => b.isCountIn)).toBe(true);
    expect(beats.filter((b) => b.isBarStart).map((b) => b.beatIndex)).toEqual([0, 4, 8, 12, 16]);
    expect(beats.slice(0, 8).map((b) => b.beatInBar)).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    expect(beats[4]).toEqual({
      time: 14, beatIndex: 4, beatInBar: 1, barIndex: 1,
      isBarStart: true, chord: 'C', nextChord: 'F', isCountIn: false,
    });
    expect(beats.slice(4, 12).map((b) => b.chord)).toEqual(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C']);
    expect(beats[12]).toMatchObject({ time: 22, barIndex: 3, chord: 'F', nextChord: null });
    expect(beats[19]).toMatchObject({ time: 29, chord: 'F', nextChord: null });
  });

  it('72BPMは60/72秒間隔', () => {
    const beats = buildBeatSchedule({ startTime: 2, bpm: 72, progression: ['C'], countInBars: 0 });
    expect(beats).toHaveLength(8);
    expect(beats[0].time).toBe(2);
    expect(beats[1].time - beats[0].time).toBeCloseTo(60 / 72);
    expect(beats[7].time).toBeCloseTo(2 + 7 * 60 / 72);
    expect(beats[0]).toMatchObject({ chord: 'C', isCountIn: false, barIndex: 0 });
  });

  it('ループ時も1周だけ返し、最後のnextChordを先頭にする', () => {
    const beats = buildBeatSchedule({ startTime: 0, bpm: 60, progression: ['C', 'F'], loop: true });
    expect(beats).toHaveLength(20);
    expect(beats[4].nextChord).toBe('F');
    expect(beats[12].nextChord).toBe('C');
    expect(beats[19].nextChord).toBe('C');
  });

  it('小節・拍数とカウント小節数を指定できる', () => {
    const beats = buildBeatSchedule({
      startTime: 0, bpm: 60, progression: ['Am', 'G'],
      beatsPerBar: 3, barsPerChord: 1, countInBars: 2,
    });
    expect(beats).toHaveLength(12);
    expect(beats.filter((b) => b.isBarStart).map((b) => b.beatIndex)).toEqual([0, 3, 6, 9]);
    expect(beats[6]).toMatchObject({ chord: 'Am', nextChord: 'G', beatInBar: 1, barIndex: 2 });
    expect(beats[9]).toMatchObject({ chord: 'G', nextChord: null });
    expect(buildBeatSchedule({ startTime: 0, bpm: 60, progression: [] })).toEqual([]);
  });

  it('無効なテンポや小節数を拒否する', () => {
    expect(() => buildBeatSchedule({ startTime: 0, bpm: 0, progression: ['C'] })).toThrow(RangeError);
    expect(() => buildBeatSchedule({
      startTime: 0, bpm: 60, progression: ['C'], barsPerChord: 0,
    })).toThrow(RangeError);
  });
});
