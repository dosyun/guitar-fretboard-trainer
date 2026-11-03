import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const oscillators: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }[] = [];
class MockAudioContext {
  state = 'running';
  currentTime = 10;
  destination = {};
  resume = vi.fn();
  createOscillator() {
    const oscillator = {
      type: '', frequency: { value: 0 }, onended: null,
      start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(),
      connect: vi.fn((node: unknown) => node),
    };
    oscillators.push(oscillator);
    return oscillator;
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() },
      connect: vi.fn(), disconnect: vi.fn(),
    };
  }
}
beforeEach(() => {
  vi.resetModules();
  oscillators.length = 0;
  vi.stubGlobal('window', Object.assign(new EventTarget(), { AudioContext: MockAudioContext }));
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe('scheduled audio', () => {
  it('uses absolute audio times and cancels every reserved source', async () => {
    const audio = await import('./audio');
    expect(audio.getAudioTime()).toBe(10);
    audio.scheduleChord([60, 64, 67], 12);
    audio.scheduleClick(13, true);
    expect(oscillators.map((osc) => osc.start.mock.calls[0][0])).toEqual([12, 12, 12, 13]);
    audio.cancelScheduled();
    expect(oscillators.map((osc) => osc.stop.mock.calls.at(-1))).toEqual([[], [], [], []]);
    expect(oscillators[0].stop.mock.calls[0][0]).toBeCloseTo(13.55);
    expect(oscillators[3].stop.mock.calls[0][0]).toBeCloseTo(13.095);
    audio.cancelScheduled();
    expect(oscillators.every((osc) => osc.stop.mock.calls.length === 2)).toBe(true);
  });
  it('cancels owned sources without stopping another reservation', async () => {
    const audio = await import('./audio');
    const chord = audio.scheduleChord([60, 64], 12);
    audio.scheduleClick(13);
    audio.cancelScheduled([chord]);
    expect(oscillators.map((osc) => osc.stop.mock.calls.length)).toEqual([2, 2, 1]);
    audio.cancelScheduled([chord]);
    expect(oscillators.map((osc) => osc.stop.mock.calls.length)).toEqual([2, 2, 1]);
  });
  it('sound OFF cancels current and future reservations and prevents new ones', async () => {
    const audio = await import('./audio');
    const changed = vi.fn();
    window.addEventListener('gft-sound-change', changed);
    audio.scheduleChord([60], 10);
    audio.scheduleClick(20);
    audio.setSoundEnabled(false);
    expect(oscillators.map((osc) => osc.stop.mock.calls.length)).toEqual([2, 2]);
    expect(changed).toHaveBeenCalledOnce();
    audio.scheduleChord([60], 30);
    audio.playChord([60]);
    expect(oscillators).toHaveLength(2);
  });
  it('does not stop ended sources again', async () => {
    const audio = await import('./audio');
    const cancel = audio.scheduleClick(12);
    oscillators[0].onended?.();
    cancel();
    audio.cancelScheduled();
    expect(oscillators[0].stop).toHaveBeenCalledTimes(1);
  });
});

it('停止が例外でも残りの予約を取り消し、再度の取消では呼び直さない', async () => {
  const audio = await import('./audio');
  audio.scheduleChord([60, 64], 12);
  audio.scheduleClick(13);
  oscillators[0].stop.mockImplementationOnce(() => { throw new Error('already stopped'); });
  expect(() => audio.cancelScheduled()).not.toThrow();
  expect(oscillators.map((osc) => osc.stop.mock.calls.length)).toEqual([2, 2, 2]);
  audio.cancelScheduled();
  expect(oscillators.map((osc) => osc.stop.mock.calls.length)).toEqual([2, 2, 2]);
});
