import { describe, expect, it } from 'vitest';
import {
  COURSE_DAYS, formNotes, formPositions, generateQuestions, guitarStringToIndex, judgeCourseAnswer,
} from './course';
import type { CourseQuestion } from './course';
import { getNoteIndex } from './fretboard';

describe('コースの形', () => {
  const frets = [
    [[0, 1, 0], [2, 1, 1], [5, 5, 3], [5, 6, 5], [9, 8, 8], [10, 10, 8]],
    [[5, 5, 3], [4, 3, 3], [9, 8, 8], [7, 8, 7], [12, 13, 12], [12, 12, 10]],
    [[5, 5, 3], [5, 6, 5], [4, 3, 3], [5, 5, 3]],
    [[5, 5, 3], [5, 5, 5], [5, 6, 5], [4, 3, 3]],
    [[2, 0, 1], [3, 2, 1], [5, 5, 5], [7, 5, 6], [10, 9, 8], [10, 10, 10]],
  ];
  const expectedTones = {
    C: { R: 0, '3': 4, '5': 7 },
    F: { R: 5, '3': 9, '5': 0 },
    G: { R: 7, '3': 11, '5': 2 },
    Am: { R: 9, '3': 0, '5': 4 },
  };

  it('全5回のフレット・弦・進行・ポジションが仕様表に一致する', () => {
    expect(COURSE_DAYS.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(COURSE_DAYS.map((d) => d.forms.map((f) => f.frets))).toEqual(frets);
    expect(COURSE_DAYS.map((d) => d.progression)).toEqual([
      ['C', 'F'], ['C', 'G'], ['C', 'F', 'G', 'C'], ['C', 'Am', 'F', 'G'], ['C', 'F'],
    ]);
    expect(COURSE_DAYS.map((d) => d.forms.map((f) => f.chord))).toEqual([
      ['C', 'F', 'C', 'F', 'C', 'F'], ['C', 'G', 'C', 'G', 'C', 'G'],
      ['C', 'F', 'G', 'C'], ['C', 'Am', 'F', 'G'], ['C', 'F', 'C', 'F', 'C', 'F'],
    ]);
    expect(COURSE_DAYS.map((d) => d.forms.map((f) => f.pos))).toEqual([
      ['low', 'low', 'mid', 'mid', 'high', 'high'],
      ['mid', 'mid', 'high', 'high', 'top', 'top'],
      ['mid', 'mid', 'mid', 'mid'], ['mid', 'mid', 'mid', 'mid'],
      ['low', 'low', 'mid', 'mid', 'high', 'high'],
    ]);
    for (const day of COURSE_DAYS) {
      expect(day.barsPerChord).toBe(2);
      expect(day.prerequisiteLessonIds).toEqual(['degree', 'triad']);
      for (const value of day.forms) {
        expect(value.strings).toEqual(day.day === 5 ? [4, 3, 2] : [3, 2, 1]);
        expect(value.id).toBe(`${value.chord}-${value.pos}`);
      }
    }
  });

  for (const day of COURSE_DAYS) {
    day.forms.forEach((value, index) => {
      it(`第${day.day}回の形${index + 1}はR・3・5をちょうど1音ずつ含む`, () => {
        const notes = formNotes(value);
        expect(notes).toHaveLength(3);
        expect(notes.map((n) => n.degree).sort()).toEqual(['3', '5', 'R']);
        for (const note of notes) {
          expect(getNoteIndex(note.note)).toBe(expectedTones[value.chord][note.degree]);
        }
      });
    });
  }

  it('ギター弦番号を既存の弦indexに変換する', () => {
    expect([guitarStringToIndex(1), guitarStringToIndex(2), guitarStringToIndex(3),
      guitarStringToIndex(4), guitarStringToIndex(5), guitarStringToIndex(6)]).toEqual([5, 4, 3, 2, 1, 0]);
    expect(formPositions(COURSE_DAYS[0].forms[0])).toEqual([
      { string: 3, fret: 0 }, { string: 4, fret: 1 }, { string: 5, fret: 0 },
    ]);
    expect(formPositions(COURSE_DAYS[4].forms[0])).toEqual([
      { string: 2, fret: 2 }, { string: 3, fret: 0 }, { string: 4, fret: 1 },
    ]);
  });
});

describe('コース出題', () => {
  it('既定10問、指定件数、キー形式、直近3問との重複回避', () => {
    expect(generateQuestions(1)).toHaveLength(10);
    expect(generateQuestions(1, 0)).toEqual([]);
    for (let day = 1; day <= 5; day++) {
      const questions = generateQuestions(day, 40, { rng: () => 0 });
      expect(questions).toHaveLength(40);
      questions.forEach((q, i) => {
        expect(q.courseKey).toMatch(/^d[1-5]:(C|F|G|Am):(low|mid|high|top):(R|3|5)$/);
        expect(questions.slice(Math.max(0, i - 3), i).map((v) => v.courseKey)).not.toContain(q.courseKey);
      });
    }
    expect(generateQuestions(3, 1, { rng: () => 0 })).toEqual([{
      chord: 'C', root: 'C', degree: 'R', interval: 'R',
      strings: [3, 4, 5], fretRange: [3, 5], pos: 'mid', courseKey: 'd3:C:mid:R',
    }]);
  });

  it('外部の直近キーを可能なら避け、全候補が直近でも必要件数を返す', () => {
    const recent = ['d1:C:low:R', 'd1:C:low:3', 'd1:C:low:5'];
    expect(generateQuestions(1, 1, { recent, rng: () => 0 })[0].courseKey).toBe('d1:F:low:R');
    const questions = generateQuestions(1, 30, { recent, rng: () => 0 });
    for (const q of questions) expect(recent).not.toContain(q.courseKey);
    const all = COURSE_DAYS[0].forms.flatMap((f) =>
      ['R', '3', '5'].map((degree) => `d1:${f.chord}:${f.pos}:${degree}`));
    const fallback = generateQuestions(1, 25, { recent: all, rng: () => 0 });
    expect(fallback).toHaveLength(25);
    expect(fallback[0].courseKey).toBe('d1:C:low:R');
    expect(fallback[1].courseKey).toBe('d1:C:low:3');
  });

  it('同じ乱数なら決定的で、第3回の重複Cを候補に二重登録しない', () => {
    expect(generateQuestions(3, 4, { rng: () => 0 }).map((q) => q.courseKey)).toEqual([
      'd3:C:mid:R', 'd3:C:mid:3', 'd3:C:mid:5', 'd3:F:mid:R',
    ]);
    // 9候補の最後はGの5度。Cを二重登録すると末尾がCになる。
    expect(generateQuestions(3, 1, { rng: () => 0.999 })[0].courseKey).toBe('d3:G:mid:5');
  });

  it('Amの3度は短3度で、移した弦セットとフレット範囲も保持する', () => {
    expect(generateQuestions(4, 1, {
      recent: ['d4:C:mid:R', 'd4:C:mid:3', 'd4:C:mid:5', 'd4:Am:mid:R'],
      rng: () => 0,
    })[0]).toMatchObject({ root: 'A', degree: '3', interval: 'm3', fretRange: [5, 5] });
    expect(generateQuestions(5, 1, { rng: () => 0 })[0]).toMatchObject({
      strings: [2, 3, 4], fretRange: [0, 2],
    });
  });
});

describe('コース回答判定', () => {
  const question: CourseQuestion = {
    chord: 'C', root: 'C', degree: 'R', interval: 'R',
    strings: [3, 4, 5], fretRange: [0, 5], pos: 'low', courseKey: 'd1:C:low:R',
  };

  it('同じ音でも弦・範囲を満たすときだけ正解', () => {
    expect(judgeCourseAnswer(question, { string: 4, fret: 1 })).toBe(true); // C
    expect(judgeCourseAnswer(question, { string: 1, fret: 3 })).toBe(false); // 5弦C
    expect(judgeCourseAnswer(question, { string: 5, fret: 8 })).toBe(false); // 範囲外C
    expect(judgeCourseAnswer(question, { string: 4, fret: 0 })).toBe(false); // B
  });

  it('全出題候補の実際の構成音を正解にする', () => {
    for (const day of COURSE_DAYS) {
      for (const value of day.forms) {
        for (const note of formNotes(value)) {
          const key = `d${day.day}:${value.chord}:${value.pos}:${note.degree}`;
          const q = generateQuestions(day.day, 1, {
            recent: day.forms.flatMap((f) => ['R', '3', '5'].map((degree) =>
              `d${day.day}:${f.chord}:${f.pos}:${degree}`)).filter((k) => k !== key),
            rng: () => 0,
          })[0];
          expect(q.courseKey).toBe(key);
          expect(judgeCourseAnswer(q, note)).toBe(true);
        }
      }
    }
  });

  it('AmはCを3度として判定し、C#は不正解', () => {
    const minor: CourseQuestion = {
      chord: 'Am', root: 'A', degree: '3', interval: 'm3',
      strings: [3, 4, 5], fretRange: [5, 6], pos: 'mid', courseKey: 'd4:Am:mid:3',
    };
    expect(judgeCourseAnswer(minor, { string: 3, fret: 5 })).toBe(true);
    expect(judgeCourseAnswer(minor, { string: 3, fret: 6 })).toBe(false);
  });
});
