import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePage } from '../HomePage';
import { PracticeCourse } from './PracticeCourse';

const hooks = vi.hoisted(() => ({
  active: false, cursor: 0, slots: [] as unknown[],
  contexts: new Map<string, unknown[]>(), time: 0, available: true, audioState: 'running' as AudioContextState,
}));
vi.mock('react', async (importOriginal) => {
  const real = await importOriginal<typeof import('react')>();
  return {
    ...real,
    useState(initial: unknown) {
      if (!hooks.active) return real.useState(initial);
      const index = hooks.cursor++;
      const slots = hooks.slots;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value: unknown) => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      }];
    },
    useRef(initial: unknown) {
      if (!hooks.active) return real.useRef(initial);
      const index = hooks.cursor++;
      if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
      return hooks.slots[index];
    },
    useCallback(callback: () => unknown, deps: unknown[]) {
      if (!hooks.active) return real.useCallback(callback, deps);
      return callback;
    },
    useEffect(effect: () => void, deps: unknown[]) {
      if (!hooks.active) real.useEffect(effect, deps);
    },
  };
});
vi.mock('../../data/audio', () => ({
  isSoundEnabled: () => true,
  setSoundEnabled: vi.fn(), playChord: vi.fn(),
  getAudioTime: () => hooks.available ? hooks.time : null,
  getAudioState: () => hooks.audioState,
  cancelScheduled: vi.fn(),
  scheduleChord: () => () => {},
  scheduleClick: () => () => {},
}));

afterEach(() => {
  hooks.active = false;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const noop = () => {};
function setup(pathname = '/fretboard/') {
  const values = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value) });
  vi.stubGlobal('window', { location: { pathname }, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('navigator', { userAgent: '' });
  return values;
}
function home() {
  return renderToStaticMarkup(createElement(HomePage, {
    accidental: 'flat', maxFret: 12, dailyLength: 15, goal: null,
    onStartGoal: noop, onDailyLengthChange: noop, onStartDaily: noop, onStartPractice: noop,
    onStartPhase: noop, onOpenStats: noop, onShowHelp: noop, onLearn: noop, onStartCourse: noop,
  }));
}
describe('course presentation', () => {
  it('shows the next unfinished day on the Japanese home only', () => {
    const values = setup();
    expect(home()).toContain('次は第1回');
    values.set('gft-course-v1', JSON.stringify({ version: 1, days: {
      1: { startedAt: 1, completedAt: 2 }, 2: { startedAt: 3, completedAt: 4 },
    } }));
    expect(home()).toContain('次は第3回');
    setup('/fretboard/en/');
    expect(home()).not.toContain('コースをはじめる');
  });
  it('renders day three directly with prerequisites and shows every day without locks', () => {
    setup();
    const props = { entry: 'direct' as const, onDayChange: noop, onLearn: noop, onExit: noop };
    const day = renderToStaticMarkup(createElement(PracticeCourse, { ...props, initialDay: 3 }));
    expect(day).toContain('第3回');
    expect(day).toContain('C・F・G をつなぐ。');
    expect(day).toContain('度数（インターバル）');
    expect(day).toContain('トライアド（3和音）');
    const list = renderToStaticMarkup(createElement(PracticeCourse, props));
    for (let n = 1; n <= 5; n++) expect(list).toContain('第' + n + '回');
    expect(list).not.toContain('disabled');
  });
});

type ViewProps = {
  children?: ReactNode; onClick?: () => void;
  onComplete?: (correct: number, wrong: []) => void; disabled?: boolean;
  value?: unknown; options?: unknown[];
};
function courseHarness() {
  setup();
  hooks.contexts.clear();
  hooks.time = 0;
  hooks.available = true;
  hooks.audioState = 'running';
  vi.useFakeTimers();
  let tree: ReactNode;
  const components = new Set(['PracticeCourse', 'CourseDayScreen', 'SwitchStep', 'Accompaniment', 'RetryStep']);
  function expand(node: ReactNode, path = 'root'): ReactNode {
    if (Array.isArray(node)) return node.map((child, index) => expand(child, path + '/' + index));
    if (!isValidElement<ViewProps>(node)) return node;
    if (typeof node.type === 'function' && components.has(node.type.name)) {
      const id = path + '/' + node.type.name + ':' + node.key;
      hooks.slots = hooks.contexts.get(id) ?? [];
      hooks.contexts.set(id, hooks.slots);
      hooks.cursor = 0;
      hooks.active = true;
      let output: ReactNode;
      try { output = (node.type as (props: ViewProps) => ReactNode)(node.props); }
      finally { hooks.active = false; }
      return expand(output, id);
    }
    return { ...node, props: { ...node.props, children: expand(node.props.children, path + '/children') } };
  }
  function render() {
    tree = expand(createElement(PracticeCourse, {
      initialDay: 1, entry: 'direct', onDayChange: noop, onLearn: noop, onExit: noop,
    }));
  }
  function nodes(node: ReactNode = tree): React.ReactElement<ViewProps>[] {
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    if (!isValidElement<ViewProps>(node)) return [];
    return [node, ...nodes(node.props.children ?? null)];
  }
  function button(label: string) {
    return nodes().find((node) => node.type === 'button' && node.props.children === label);
  }
  function click(label: string) {
    const found = button(label);
    expect(found, label).toBeDefined();
    found!.props.onClick!();
    render();
  }
  render();
  return { render, nodes, button, click };
}
function switchView() {
  const view = courseHarness();
  expect(view.button('度数（インターバル）')).toBeDefined();
  view.click('見た');
  expect(view.button('度数（インターバル）')).toBeUndefined();
  const round = view.nodes().find((node) => typeof node.type === 'function' && node.type.name === 'CourseRound');
  expect(round).toBeDefined();
  round!.props.onComplete!(10, []);
  view.render();
  return view;
}

describe('伴奏の完了導線', () => {
  it('再生に失敗しても理由を表示して自己申告に進める', () => {
    const view = switchView();
    hooks.audioState = 'suspended';
    view.click('伴奏を再生');
    vi.advanceTimersByTime(1000);
    view.render();
    expect(view.nodes().some((node) => node.props.children === '音を再生できませんでした')).toBe(true);
    expect(view.button('停止')).toBeUndefined();
    view.click('演奏を終えた');
    expect(view.button('もう一度へ')).toBeDefined();
  });

  it('再生して停止すると演奏を終えたが現れ、途中停止が初期選択になる', () => {
    const view = switchView();
    expect(view.button('演奏を終えた')).toBeUndefined();
    view.click('伴奏を再生');
    view.click('停止');
    expect(view.button('演奏を終えた')).toBeDefined();
    view.click('演奏を終えた');
    expect(view.nodes().find((node) => node.props.options && node.props.value === 1)).toBeDefined();
    expect(view.button('もう一度へ')?.props.disabled).toBe(true);
  });

  it('最後まで再生した場合は止まらず弾けたが初期選択になる', () => {
    const view = switchView();
    view.click('伴奏を再生');
    hooks.time = 69;
    vi.advanceTimersByTime(25);
    view.render();
    view.click('演奏を終えた');
    expect(view.nodes().find((node) => node.props.options && node.props.value === 0)).toBeDefined();
    expect(view.button('もう一度へ')?.props.disabled).toBe(false);
  });

  it('音声が利用不能でも理由を表示して自己申告に進める', () => {
    const view = switchView();
    hooks.available = false;
    view.click('伴奏を再生');
    expect(view.nodes().some((node) => node.props.children === '音が出せない環境です')).toBe(true);
    view.click('演奏を終えた');
    expect(view.button('もう一度へ')).toBeDefined();
  });
});
