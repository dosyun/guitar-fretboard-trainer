import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dictionary, t, phrase, intervalLabel, languageFromPath, currentLanguageUrl } from './index';
import { localizeSource } from './source';

const japanese = /[\u3040-\u30ff\u4e00-\u9fff]/;
const nativeRequire = createRequire(import.meta.url);
const root = resolve('.');
class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

function useLanguage(path = '/fretboard/en/') {
  vi.stubGlobal('window', { location: { pathname: path, replace: vi.fn() }, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('navigator', { userAgent: '' });
  vi.stubGlobal('localStorage', new MemoryStorage());
}

// Execute the same transformed source used by Vite without changing any file.
// Dependencies are real; only the absolute Vite import is bridged to this module.
function evaluateFile(fileName: string, cache = new Map<string, Record<string, unknown>>()) {
  const path = resolve(root, fileName);
  const existing = cache.get(path);
  if (existing) return existing;
  const exports: Record<string, unknown> = {};
  cache.set(path, exports);
  const localized = localizeSource(readFileSync(path, 'utf8'), path);
  const output = ts.transpileModule(localized.code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    reportDiagnostics: true,
  });
  expect(output.diagnostics ?? []).toEqual([]);
  const require = (name: string): unknown => {
    if (name === '/src/i18n/index.ts' || /\/i18n$/.test(name)) return { t, phrase, intervalLabel, currentLanguageUrl };
    if (!name.startsWith('.')) return nativeRequire(name);
    const base = resolve(dirname(path), name);
    const dependency = [base, base + '.ts', base + '.tsx', base + '/index.ts'].find((candidate) =>
      existsSync(candidate) && /\.tsx?$/.test(candidate));
    if (!dependency) throw new Error('Unresolved test dependency: ' + name);
    return evaluateFile(dependency, cache);
  };
  new Function('require', 'exports', output.outputText)(require, exports);
  return exports;
}

function sourceFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const next = resolve(path, entry.name);
    return entry.isDirectory() ? sourceFiles(next) : [next];
  }).filter((file) => /\.tsx?$/.test(file) && !file.includes('/i18n/') && !file.includes('\\i18n\\') && !file.endsWith('.test.ts'));
}

afterEach(() => vi.unstubAllGlobals());

describe('URL language and dictionary coverage', () => {
  it('uses the URL only and keeps recovery in the current language', () => {
    expect(languageFromPath('/fretboard/en/')).toBe('en');
    expect(languageFromPath('/fretboard/en/anything')).toBe('en');
    expect(languageFromPath('/fretboard/')).toBe('ja');
    expect(languageFromPath('/fretboard/english/')).toBe('ja');
    useLanguage();
    localStorage.setItem('language', 'ja');
    expect(currentLanguageUrl()).toBe('/fretboard/en/');
    useLanguage('/fretboard/');
    expect(currentLanguageUrl()).toBe('/fretboard/');
  });

  it('covers every presentation literal, including all lesson content', () => {
    expect(Object.keys(dictionary.ja).sort()).toEqual(Object.keys(dictionary.en).sort());
    for (const value of Object.values(dictionary.en)) expect(value).not.toMatch(japanese);
    for (const file of sourceFiles(resolve(root, 'src'))) {
      const { messages } = localizeSource(readFileSync(file, 'utf8'), file);
      for (const key of messages) {
        expect(dictionary.en[key], file + ': ' + key).toBeDefined();
        expect(dictionary.ja[key], file + ': ' + key).toBeDefined();
      }
    }
  });

  it('reorders interpolations and keeps interval codes separate from their labels', () => {
    useLanguage();
    expect(t('{0}弦 {1}フレットの音名は？', 6, 3)).toBe('What note is at fret 3 on string 6?');
    expect(intervalLabel('m3')).toBe('minor 3rd');
    expect(intervalLabel('P5')).toBe('perfect 5th');
    expect(phrase('{0} の {1} を選べ', ['C', 'major 3rd']).join('')).toBe('Find the major 3rd of C.');
    useLanguage('/fretboard/');
    expect(intervalLabel('m3')).toBe('m3');
    expect(t('正解!')).toBe('正解!');
  });
});

describe('real transformed English presentation', () => {
  it('renders headings, help, settings, statistics, and all practice modes without Japanese', () => {
    useLanguage();
    const noop = () => {};
    const cache = new Map<string, Record<string, unknown>>();
    const cases: [string, string, Record<string, unknown>][] = [
      ['OnboardingScreen', 'OnboardingScreen', { onDone: noop }],
      ['HomePage', 'HomePage', { accidental: 'sharp', maxFret: 12, dailyLength: 10, goal: null,
        onStartGoal: noop, onDailyLengthChange: noop, onStartDaily: noop, onStartPractice: noop,
        onStartPhase: noop, onOpenStats: noop, onShowHelp: noop, onLearn: noop }],
      ['StatsPage', 'StatsPage', { accidental: 'sharp', maxFret: 12, onDrill: noop }],
      ['SettingsPanel', 'SettingsPanel', { accidental: 'sharp', maxFret: 12, goalLabel: null,
        onChangeGoal: noop, onAccidentalChange: noop, onMaxFretChange: noop, onReset: noop, onClearHistory: noop }],
      ['LessonsPage', 'LessonsPage', { onGoto: noop }],
      ['HelpPage', 'HelpPage', {}],
      ['AboutPage', 'AboutPage', {}],
      ...['ChordToneQuiz', 'ChordProgressionQuiz', 'GuideToneTrainer', 'TriadBuilder',
        'KeyFunctionQuiz', 'EarTrainingQuiz'].map((name): [string, string, Record<string, unknown>] =>
        [name, name, { accidental: 'sharp', maxFret: 12 }]),
    ];
    for (const [file, name, props] of cases) {
      const component = evaluateFile('src/components/' + file + '.tsx', cache)[name] as React.ComponentType;
      const html = renderToStaticMarkup(createElement(component, props));
      expect(html, file).not.toMatch(japanese);
    }
  });

  it('translates all 21 lesson bodies, examples, questions, and explanations while preserving IDs and answers', () => {
    useLanguage();
    const english = evaluateFile('src/data/lessons.ts').LESSONS as { id: string; check?: { answer: number }[] }[];
    expect(english).toHaveLength(21);
    expect(JSON.stringify(english)).not.toMatch(japanese);
    useLanguage('/fretboard/');
    const original = evaluateFile('src/data/lessons.ts').LESSONS as typeof english;
    expect(english.map((lesson) => [lesson.id, lesson.check?.map((question) => question.answer)]))
      .toEqual(original.map((lesson) => [lesson.id, lesson.check?.map((question) => question.answer)]));
    expect(JSON.stringify(original)).toMatch(japanese);
  });

  it('retains the upper-fret weakness drill range in English', () => {
    useLanguage();
    localStorage.setItem('gft-attempts-v1', JSON.stringify(Array.from({ length: 8 }, (_, i) => ({
      id: String(i), quizType: 'position-to-note', isCorrect: false, responseTimeMs: 1000,
      string: i % 6, fret: 10 + i % 3, note: 'C', createdAt: i,
    }))));
    const { diagnose } = evaluateFile('src/data/mistakeClinic.ts') as { diagnose: (accidental: string) => { id: string; text: string; drillFretRange?: number[] }[] };
    const diagnoses = diagnose('sharp');
    expect(diagnoses.find((diagnosis) => diagnosis.id === 'fret')?.drillFretRange).toEqual([10, 99]);
    expect(JSON.stringify(diagnoses)).not.toMatch(japanese);
  });

  it('keeps Japanese backup data byte-for-byte compatible with English import', () => {
    useLanguage('/fretboard/');
    localStorage.setItem('gft-sessions-v1', '[{"id":"same-session","count":10}]');
    localStorage.setItem('gft-goal-v1', 'note');
    const backupModule = evaluateFile('src/data/backup.ts') as {
      exportBackup: (now: number) => { data: Record<string, string> };
      importBackup: (value: unknown) => { ok: boolean; error?: string };
    };
    const backup = backupModule.exportBackup(123);
    const raw = JSON.stringify(backup);
    useLanguage();
    const englishModule = evaluateFile('src/data/backup.ts') as typeof backupModule;
    expect(englishModule.importBackup(JSON.parse(raw)).ok).toBe(true);
    expect(englishModule.exportBackup(123)).toEqual(backup);
    expect(englishModule.importBackup(null).error).not.toMatch(japanese);
  });

  it('recovers from a rendering error at the English URL', () => {
    useLanguage();
    const { ErrorBoundary } = evaluateFile('src/components/ErrorBoundary.tsx') as typeof import('../components/ErrorBoundary');
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { error: new Error('test') };
    const tree = boundary.render();
    expect(renderToStaticMarkup(tree)).not.toMatch(japanese);
    function clickReload(node: ReactNode): boolean {
      if (Array.isArray(node)) return node.some(clickReload);
      if (!isValidElement<{ onClick?: () => void; children?: ReactNode }>(node)) return false;
      if (node.type === 'button' && node.props.onClick) { node.props.onClick(); return true; }
      return clickReload(node.props.children);
    }
    expect(clickReload(tree)).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith('/fretboard/en/');
  });
});
