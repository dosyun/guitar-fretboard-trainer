import { describe, expect, it } from 'vitest';
import { COURSE_DAYS, formNotes, judgeCourseAnswer } from './course';
import { formMidis, questionForKey, retryQuestions, switchesForDay } from './courseSession';
import type { PracticeAttempt } from '../types/practice';

describe('course retry and switches', () => {
  it('restores the original string set, range, root, and minor third from a key', () => {
    const question = questionForKey('d4:Am:mid:3')!;
    expect(question.root).toBe('A');
    expect(question.interval).toBe('m3');
    expect(question.strings).toEqual([3, 4, 5]);
    expect(question.fretRange).toEqual([5, 5]);
    expect(judgeCourseAnswer(question, { string: 3, fret: 5 })).toBe(true);
    expect(judgeCourseAnswer(question, { string: 5, fret: 5 })).toBe(false);
    expect(questionForKey('d5:C:low:R')!.strings).toEqual([2, 3, 4]);
    expect(questionForKey('d6:C:low:R')).toBeUndefined();
    expect(questionForKey('d1:Am:mid:3')).toBeUndefined();
  });

  it('combines current mistakes and past course keys, deduplicates and caps at five', () => {
    const keys = ['d1:C:low:R', 'd1:F:low:3', 'd2:C:mid:5', 'd3:G:mid:R', 'd4:Am:mid:3', 'd5:C:high:R'];
    const current = keys.slice(0, 2).map((key) => questionForKey(key)!);
    const history = keys.map((courseKey) => ({ courseKey } as PracticeAttempt));
    expect(retryQuestions(current, history).map((q) => q.courseKey)).toEqual([
      'd1:F:low:3', 'd1:C:low:R', 'd2:C:mid:5', 'd3:G:mid:R', 'd4:Am:mid:3',
    ]);
    expect(retryQuestions([], [{ courseKey: 'bad' } as PracticeAttempt])).toEqual([]);
  });

  it('offers exact adjacent pairs including return switches, without a C-to-C switch', () => {
    expect(switchesForDay(COURSE_DAYS[0]).map((pair) => pair.id)).toEqual([
      'C>F:low', 'F>C:low', 'C>F:mid', 'F>C:mid', 'C>F:high', 'F>C:high',
    ]);
    expect(switchesForDay(COURSE_DAYS[2]).map((pair) => pair.id)).toEqual(['C>F:mid', 'F>G:mid', 'G>C:mid']);
    const pair = switchesForDay(COURSE_DAYS[4]).find((item) => item.id === 'C>F:high')!;
    expect(formNotes(pair.from).map((note) => [note.string, note.fret])).toEqual([[2, 10], [3, 9], [4, 8]]);
    expect(formMidis(pair.from)).toEqual([60, 64, 67]);
  });
});
