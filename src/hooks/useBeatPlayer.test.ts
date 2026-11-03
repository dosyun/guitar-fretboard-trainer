import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BeatPlayerOptions } from './useBeatPlayer';

const runtime = vi.hoisted(() => ({
  slots: [] as unknown[], cursor: 0, pending: [] as (() => void)[],
  time: 0, enabled: true,
}));
const audio = vi.hoisted(() => ({
  getAudioTime: vi.fn((): number | null => runtime.time),
  getAudioState: vi.fn((): AudioContextState => 'running'),
  isSoundEnabled: vi.fn(() => runtime.enabled),
  scheduleClick: vi.fn((_time: number, _accent: boolean) => vi.fn()),
  scheduleChord: vi.fn((_midis: number[], _time: number) => vi.fn()),
  cancelScheduled: vi.fn((handles: (() => void)[] = []) => handles.forEach((cancel) => cancel())),
}));
// React境界だけを置換する。時計、拍の生成、フック本体は実コードを実行する。
vi.mock('react', () => {
  const same = (a: unknown[], b: unknown[]) =>
    a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  return {
    useState(initial: unknown) {
      const index = runtime.cursor++;
      if (!(index in runtime.slots)) runtime.slots[index] = initial;
      return [runtime.slots[index], (value: unknown) => {
        runtime.slots[index] = typeof value === 'function' ? value(runtime.slots[index]) : value;
      }];
    },
    useRef(initial: unknown) {
      const index = runtime.cursor++;
      if (!(index in runtime.slots)) runtime.slots[index] = { current: initial };
      return runtime.slots[index];
    },
    useCallback(callback: unknown, deps: unknown[]) {
      const index = runtime.cursor++;
      const previous = runtime.slots[index] as { deps: unknown[]; callback: unknown } | undefined;
      if (!previous || !same(previous.deps, deps)) runtime.slots[index] = { deps, callback };
      return (runtime.slots[index] as { callback: unknown }).callback;
    },
    useEffect(effect: () => void | (() => void), deps: unknown[]) {
      const index = runtime.cursor++;
      const previous = runtime.slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (previous && same(previous.deps, deps)) return;
      const slot = { deps, cleanup: undefined as (() => void) | undefined };
      runtime.slots[index] = slot;
      runtime.pending.push(() => { previous?.cleanup?.(); slot.cleanup = effect() || undefined; });
    },
  };
});
vi.mock('../data/audio', () => audio);
import { useBeatPlayer as runBeatPlayer } from './useBeatPlayer';

const progression = [{ id: 'C', midis: [60, 64, 67] }, { id: 'F', midis: [65, 69, 72] }];
let options: BeatPlayerOptions;
function render() {
  runtime.cursor = 0;
  const result = runBeatPlayer(options);
  runtime.pending.splice(0).forEach((effect) => effect());
  return result;
}
function unmount() {
  for (const slot of runtime.slots) {
    if (slot && typeof slot === 'object' && 'cleanup' in slot) (slot as { cleanup?: () => void }).cleanup?.();
  }
}
function advance(time: number) {
  runtime.time = time;
  vi.advanceTimersByTime(25);
  return render();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  runtime.slots = [];
  runtime.cursor = 0;
  runtime.pending = [];
  runtime.time = 0;
  runtime.enabled = true;
  audio.getAudioTime.mockImplementation(() => runtime.time);
  audio.getAudioState.mockReturnValue('running');
  vi.stubGlobal('window', new EventTarget());
  options = { progression, bpm: 60, soundEnabled: true };
  render();
});
afterEach(() => { unmount(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('beat playback', () => {
  it('schedules only 150ms ahead and displays chords only when the clock reaches them', () => {
    render().start();
    expect(audio.scheduleClick).toHaveBeenCalledWith(0.05, true);
    expect(render()).toMatchObject({ isCountIn: true, currentChord: null });
    expect(advance(0.05)).toMatchObject({ beatInBar: 1 });
    expect(advance(1.05)).toMatchObject({ beatInBar: 2, currentChord: null });
    expect(advance(2.05)).toMatchObject({ beatInBar: 3 });
    expect(advance(3.05)).toMatchObject({ beatInBar: 4 });
    advance(3.89);
    expect(audio.scheduleChord).not.toHaveBeenCalled();
    expect(advance(3.95)).toMatchObject({ currentChord: null, isCountIn: true });
    expect(audio.scheduleChord).toHaveBeenCalledWith([60, 64, 67], 4.05);
    expect(advance(4.05)).toMatchObject({ currentChord: 'C', nextChord: 'F', beatInBar: 1 });
    expect(advance(12.05)).toMatchObject({ currentChord: 'F', nextChord: 'C' });
  });
  it.each([60, 72, 84] as const)('finishes sixteen bars plus count-in at %i BPM', (bpm) => {
    options = { ...options, bpm };
    render();
    render().start();
    for (let beat = 0; beat < 68; beat++) advance(0.05 + beat * 60 / bpm);
    expect(render()).toMatchObject({ isPlaying: true, hasFinished: false, nextChord: null });
    expect(advance(0.05 + 68 * 60 / bpm + 0.001)).toMatchObject({ isPlaying: false, hasFinished: true });
    expect(vi.getTimerCount()).toBe(0);
  });
  it('stops and cancels on restart, BPM remount, sound OFF, and unmount', () => {
    render().start();
    const first = audio.scheduleClick.mock.results[0].value;
    render().start();
    expect(first).toHaveBeenCalledOnce();
    options = { ...options, progression: progression.map((chord) => ({ ...chord })) };
    expect(render().isPlaying).toBe(true);
    unmount(); // Accompaniment の BPM キー変更と同じく再マウントする。
    expect(vi.getTimerCount()).toBe(0);
    runtime.slots = [];
    runtime.pending = [];
    options = { ...options, bpm: 72 };
    expect(render().isPlaying).toBe(false);
    render().start();
    runtime.enabled = false;
    window.dispatchEvent(new Event('gft-sound-change'));
    expect(render()).toMatchObject({ isPlaying: false, hasFinished: false });
    runtime.enabled = true;
    render().start();
    const last = audio.scheduleClick.mock.results.at(-1)!.value;
    unmount();
    expect(last).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cannot start while disabled or without an audio clock', () => {
    options = { ...options, soundEnabled: false };
    render();
    render().start();
    expect(audio.scheduleClick).not.toHaveBeenCalled();
    options = { ...options, soundEnabled: true };
    render();
    audio.getAudioTime.mockReturnValue(null);
    render().start();
    expect(render().isPlaying).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

it('停止しても再生開始済みを保持する', () => {
  render().start();
  expect(render()).toMatchObject({ isPlaying: true, hasStarted: true });
  render().stop();
  expect(render()).toMatchObject({ isPlaying: false, hasStarted: true, hasFinished: false });
});

it('AudioContextが1秒後もrunningでなければ停止して失敗を返す', () => {
  audio.getAudioState.mockReturnValue('suspended');
  render().start();
  vi.advanceTimersByTime(975);
  expect(render().isPlaying).toBe(true);
  vi.advanceTimersByTime(25);
  expect(render()).toMatchObject({ isPlaying: false, failed: true, hasStarted: true });
  expect(vi.getTimerCount()).toBe(0);
  expect(audio.cancelScheduled).toHaveBeenCalled();
});

it('1秒以内にrunningになれば停止させない', () => {
  audio.getAudioState.mockReturnValue('suspended');
  render().start();
  vi.advanceTimersByTime(975);
  audio.getAudioState.mockReturnValue('running');
  vi.advanceTimersByTime(25);
  expect(render()).toMatchObject({ isPlaying: true, failed: false });
});

it('時計が利用不能なら理由を返してタイマーを作らない', () => {
  audio.getAudioTime.mockReturnValue(null);
  render().start();
  expect(render()).toMatchObject({ isPlaying: false, unavailable: true });
  expect(vi.getTimerCount()).toBe(0);
});
