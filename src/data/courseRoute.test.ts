import { describe, expect, it } from 'vitest';
import { courseEntry, courseLocation, parseCourseDay, readCourseRoute } from './courseRoute';
import { LESSONS } from './lessons';

describe('course routes', () => {
  it('opens day three directly and leaves existing entry points alone', () => {
    expect(readCourseRoute('/fretboard/course/', '?day=3&from=hub', '')).toEqual({ day: 3, entry: 'hub' });
    expect(readCourseRoute('/fretboard/course/', '', '')).toEqual({ day: undefined, entry: 'direct' });
    expect(readCourseRoute('/fretboard/', '?day=3', '')).toBeUndefined();
    expect(readCourseRoute('/fretboard/ear-training/', '?day=3', '')).toBeUndefined();
  });
  it.each(['', '?day=0', '?day=6', '?day=-1', '?day=3.5', '?day=03', '?day=3x'])('rejects invalid days %s', (search) => {
    expect(parseCourseDay(search)).toBeUndefined();
  });
  it('preserves attribution when changing the day and returning to the list', () => {
    expect(courseLocation('/fretboard/', 3, '?from=hub&utm_source=theory', '#practice')).toBe(
      '/fretboard/course/?from=hub&utm_source=theory&day=3#practice',
    );
    expect(courseLocation('/fretboard/', undefined, '?day=3&from=hub', '')).toBe('/fretboard/course/?from=hub');
  });
  it('uses explicit entry before referrer, and ignores unrelated origins', () => {
    expect(courseEntry('?from=lesson', 'https://guitartoolbox.site/')).toBe('lesson');
    expect(courseEntry('', 'https://guitartoolbox.site/theory/triads/')).toBe('hub');
    expect(courseEntry('', 'https://example.com/theory/')).toBe('direct');
    expect(courseEntry('?from=unknown', '')).toBe('direct');
  });
  it('connects the triad lesson to the course', () => {
    expect(LESSONS.find((lesson) => lesson.id === 'triad')?.link?.target).toBe('course');
  });
});
