import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from './analytics';
import type { CourseEventName } from './analytics';

afterEach(() => vi.unstubAllGlobals());

describe('コース計測', () => {
  it('windowもgtagもないときは何もしない', () => {
    vi.stubGlobal('window', undefined);
    expect(() => track('course_view')).not.toThrow();
    vi.stubGlobal('window', {});
    expect(() => track('course_view')).not.toThrow();
    vi.stubGlobal('window', { gtag: 'unavailable' });
    expect(() => track('course_view')).not.toThrow();
  });

  it.each<CourseEventName>([
    'course_view', 'course_day_start', 'course_step_complete', 'course_day_complete', 'course_to_looper',
  ])('%sをeventとして1回送る', (name) => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    track(name, { course_day: 1, entry: 'direct', is_repeat: false });
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', name, { course_day: 1, entry: 'direct', is_repeat: false });
  });

  it('パラメータ省略時も送信できる', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    track('course_view');
    expect(gtag).toHaveBeenCalledWith('event', 'course_view', undefined);
  });

  it('gtagの例外を外に出さない', () => {
    vi.stubGlobal('window', { gtag: () => { throw new Error('blocked'); } });
    expect(() => track('course_day_complete')).not.toThrow();
  });

  it('gtagプロパティへのアクセスが失敗しても例外を外に出さない', () => {
    vi.stubGlobal('window', { get gtag() { throw new Error('unavailable'); } });
    expect(() => track('course_view')).not.toThrow();
  });
});

it('gtagの読込前も既存キューを保持してArguments形式で追加する', () => {
  vi.stubGlobal('window', {});
  track('course_view', { entry: 'direct' });
  const queue = window.dataLayer!;
  expect(queue).toHaveLength(1);
  expect(Object.prototype.toString.call(queue[0])).toBe('[object Arguments]');
  expect(Array.from(queue[0] as IArguments)).toEqual(['event', 'course_view', { entry: 'direct' }]);
  track('course_day_start', { course_day: 2 });
  expect(window.dataLayer).toBe(queue);
  expect(queue).toHaveLength(2);
  expect(Array.from(queue[1] as IArguments)).toEqual(['event', 'course_day_start', { course_day: 2 }]);
});
