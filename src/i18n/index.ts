import type { ReactNode } from 'react';
import { uiEnglish } from './ui';
import { referenceEnglish } from './reference';
import { lessonEnglish } from './lessons';

export type Language = 'ja' | 'en';

export function languageFromPath(path: string): Language {
  return path.startsWith('/fretboard/en/') ? 'en' : 'ja';
}

export function getLanguage(): Language {
  const browserWindow = (globalThis as typeof globalThis & {
    window?: { location: { pathname: string } };
  }).window;
  return languageFromPath(browserWindow?.location.pathname ?? '/fretboard/');
}

export function currentLanguageUrl(language = getLanguage()): string {
  return language === 'en' ? '/fretboard/en/' : '/fretboard/';
}

/**
 * 用語対応表（保存用コードは変更せず、文章・回答ボタンで展開する）
 * 音名: note name; 度数/音程: interval; ルート: root
 * 長3度: major 3rd; 短3度: minor 3rd; 完全5度: perfect 5th
 * コードトーン: chord tone; ガイド音: guide tone; フォーム: shape
 * バレーコード: barre chord; 開放弦: open string
 * 全音（距離）: whole step; 全音（範囲）: all notes
 * 平行調: relative key; 同主調: parallel key; テンション: extension
 * キー機能: harmonic function; トニック/SD/D: tonic/subdominant/dominant
 * 図の R, m3, P5, ♭3 等は標準の略記。保存データも同じ略記を保つ。
 */
const en: Record<string, string> = {
  ...lessonEnglish,
  ...referenceEnglish,
  ...uiEnglish,
  'キー機能': 'Harmonic function',
  'キー機能の練習をはじめる': 'Practice harmonic function',
  '音名認識': 'Note recognition',
  '{0} の {1} を選べ': 'Find the {1} of {0}.',
  '{0} の {1} を弾け': 'Play the {1} of {0}.',
  '{0} の {1}（ガイド音）を弾け': 'Play the {1} guide tone of {0}.',
  'Key {0} で {1} は？': 'In the key of {0}, what is {1}?',
  '{0}（{1}）を作ろう': 'Build {0} ({1}).',
  '選んだ {0} は {1}（このコードの構成音ではない）': 'You chose {0}: {1}, which is not a chord tone.',
  '選んだ {0} は {1}': 'You chose {0}: {1}.',
  '今日の{0}問をはじめる': "Start today's {0} questions",
  '🎉 全{0}レッスン制覇！': '🎉 All {0} lessons complete!',
  '{0}問の記録。{1}問以上つづけると中央値・前回比が出ます。': '{0} questions recorded. Answer at least {1} questions to see your median and comparison with the previous session.',
  '推移（直近{0}セッション）': 'Trends (last {0} sessions)',
  '「{0}」を10問だけ練習': 'Practice {0} for 10 questions',
  'Safariの共有ボタン {0} →「{1}」でアプリになります。': 'In Safari, tap Share {0}, then “{1}” to install the app.',
  '問': ' questions',
  '弦': ' string',
  '問 全問正解': ' questions — all correct',
  '開放〜4F': 'Open–fret 4',
  '開放〜5F': 'Open–fret 5',
  'root': 'Root',
  'minor2': 'minor 2nd',
  'major2': 'major 2nd',
  'minor3': 'minor 3rd',
  'major3': 'major 3rd',
  'perfect4': 'perfect 4th',
  'tritone': 'tritone',
  'perfect5': 'perfect 5th',
  'minor6': 'minor 6th',
  'major6': 'major 6th',
  'minor7': 'minor 7th',
  'major7': 'major 7th',
};
const ja: Record<string, string> = Object.fromEntries(Object.keys(en).map((key) => [key, key]));
Object.assign(ja, {
  root: 'ルート', minor2: '短2度', major2: '長2度',
  minor3: '短3度', major3: '長3度', perfect4: '完全4度',
  tritone: 'トライトーン', perfect5: '完全5度',
  minor6: '短6度', major6: '長6度', minor7: '短7度', major7: '長7度',
});

export const dictionary = { ja, en };

function message(key: string, language: Language): string {
  return dictionary[language][key] ?? key;
}

export function t(key: string, ...values: unknown[]): string {
  return message(key, getLanguage()).replace(/\{(\d+)\}/g, (placeholder, index: string) =>
    Number(index) < values.length ? String(values[Number(index)] ?? '') : placeholder);
}

// Keep emphasized notes and chord symbols while allowing English word order.
export function phrase(key: string, values: ReactNode[]): ReactNode[] {
  return message(key, getLanguage()).split(/(\{\d+\})/g).map((part) => {
    const match = /^\{(\d+)\}$/.exec(part);
    return match ? values[Number(match[1])] : part;
  });
}

const intervalTerms: Record<string, string> = {
  R: 'root', m2: 'minor2', M2: 'major2', m3: 'minor3', M3: 'major3',
  P4: 'perfect4', '#4/b5': 'tritone', P5: 'perfect5',
  m6: 'minor6', M6: 'major6', m7: 'minor7', M7: 'major7',
};

export function intervalLabel(code: string | null | undefined): string {
  if (!code) return '';
  return getLanguage() === 'en' && intervalTerms[code] ? t(intervalTerms[code]) : code;
}
