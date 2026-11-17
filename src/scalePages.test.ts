import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

interface Tone { fret: number; midi: number; note: string; degree: string }
interface Position { id: string; from: number; to: number; strings: Tone[][] }
interface Scale {
  slug: string; root: number; intervals: number[]; degrees: string[];
  rootFrets: { r5: number; r6: number };
  positions: { id: string; range?: number[]; anchor?: string; offsets?: number[] }[];
}
interface Page { slug: string; language: 'ja' | 'en'; path: string; html: string }
const load = async () => ({
  data: await import(pathToFileURL(resolve('scripts/scale-pages/scales.mjs')).href) as { SCALES: Scale[] },
  generator: await import(pathToFileURL(resolve('scripts/generate-scale-pages.mjs')).href) as {
    renderScalePages: () => Page[];
    SCALE_SLUGS: string[];
    positionsOf: (scale: Scale) => Position[];
    validatePosition: (scale: Scale, position: Position) => void;
  },
});

const SITE = 'https://guitartoolbox.site/fretboard/';
const OPEN = [40, 45, 50, 55, 59, 64];
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const IDS = ['open', 'fifth-root', 'sixth-root'];
const SPEC: Record<string, { root: number; intervals: number[]; degrees: string[]; ranges: number[][]; expected: string[] }> = {
  'c-major': {
    root: 0, intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ['R', '2', '3', '4', '5', '6', '7'],
    ranges: [[0, 3], [2, 5], [7, 10]],
    expected: [
      '0:E/3 1:F/4 3:G/5|0:A/6 2:B/7 3:C/R|0:D/2 2:E/3 3:F/4|0:G/5 2:A/6|0:B/7 1:C/R 3:D/2|0:E/3 1:F/4 3:G/5',
      '3:G/5 5:A/6|2:B/7 3:C/R 5:D/2|2:E/3 3:F/4 5:G/5|2:A/6 4:B/7 5:C/R|3:D/2 5:E/3|3:G/5 5:A/6',
      '7:B/7 8:C/R 10:D/2|7:E/3 8:F/4 10:G/5|7:A/6 9:B/7 10:C/R|7:D/2 9:E/3 10:F/4|8:G/5 10:A/6|7:B/7 8:C/R 10:D/2',
    ],
  },
  dorian: {
    root: 2, intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ['R', '2', 'm3', '4', '5', '6', 'm7'],
    ranges: [[0, 3], [4, 7], [9, 12]],
    expected: [
      '0:E/2 1:F/m3 3:G/4|0:A/5 2:B/6 3:C/m7|0:D/R 2:E/2 3:F/m3|0:G/4 2:A/5|0:B/6 1:C/m7 3:D/R|0:E/2 1:F/m3 3:G/4',
      '5:A/5 7:B/6|5:D/R 7:E/2|5:G/4 7:A/5|4:B/6 5:C/m7 7:D/R|5:E/2 6:F/m3|5:A/5 7:B/6',
      '10:D/R 12:E/2|10:G/4 12:A/5|9:B/6 10:C/m7 12:D/R|9:E/2 10:F/m3 12:G/4|10:A/5 12:B/6|10:D/R 12:E/2',
    ],
  },
};

// 生成コード・データを使わず、仕様の MIDI 開放弦から1フレットずつ数えます。
function independentlyCount(slug: string, from: number, to: number): string[][] {
  const spec = SPEC[slug];
  return OPEN.map((open) => {
    const result: string[] = [];
    for (let fret = from; fret <= to; fret++) {
      const pc = (open + fret) % 12;
      const index = spec.intervals.indexOf((pc - spec.root + 12) % 12);
      if (index >= 0) result.push(`${fret}:${NAMES[pc]}/${spec.degrees[index]}`);
    }
    return result;
  });
}

function rowsOf(html: string, id: string): string[][] {
  const body = html.match(new RegExp(`<table id="${id}">[\\s\\S]*?<tbody>([\\s\\S]*?)</tbody>`))?.[1];
  expect(body, id).toBeDefined();
  return [...body!.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
    [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]));
}

function checkPage(html: string, slug: string, language: 'ja' | 'en') {
  const relative = `${language === 'en' ? 'en/' : ''}scales/${slug}/`;
  expect(html).toContain(`<html lang="${language}">`);
  expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
  expect(html).toContain(`rel="canonical" href="${SITE}${relative}"`);
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    .map((match) => [match[1], match[2]]);
  expect(alternates).toEqual([
    ['ja', `${SITE}scales/${slug}/`], ['en', `${SITE}en/scales/${slug}/`],
    ['x-default', `${SITE}en/scales/${slug}/`],
  ]);
  const other = slug === 'c-major' ? 'dorian' : 'c-major';
  expect(html).toContain(`href="/fretboard/${language === 'en' ? 'en/' : ''}scales/${other}/"`);
  expect(html).toContain(`href="/fretboard/${language === 'en' ? 'en/' : ''}"`);
  expect(html).toContain(`href="/fretboard/${language === 'en' ? '' : 'en/'}scales/${slug}/"`);
  expect(html).not.toContain('[NEED');
  expect(html).not.toMatch(/(?:src|href)=["'][^"']*\/src\//);
  expect([...html.matchAll(/<svg\b/g)]).toHaveLength(4);
  expect([...html.matchAll(/<dt>/g)]).toHaveLength(3);
  if (language === 'en') expect(html).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/);
  else {
    for (const path of ['/theory/modes/', '/theory/major-minor-scale/', '/fretboard/guides/memorize-fretboard/']) {
      expect(html).toContain(`href="${path}"`);
    }
  }
  const json = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
  expect(json).toHaveLength(2);
  expect(json[0]).toMatchObject({ '@type': 'Article', url: `${SITE}${relative}`, inLanguage: language });
  expect(json[1]).toMatchObject({ '@type': 'BreadcrumbList' });
}

describe('scale pages', () => {
  it('matches all six hand-counted positions and independently counted notes', async () => {
    const { data, generator } = await load();
    expect(data.SCALES.map((scale) => scale.slug)).toEqual(['c-major', 'dorian']);
    for (const scale of data.SCALES) {
      const spec = SPEC[scale.slug];
      expect(scale.root).toBe(spec.root);
      expect(scale.intervals).toEqual(spec.intervals);
      expect(scale.degrees).toEqual(spec.degrees);
      const positions = generator.positionsOf(scale);
      expect(positions.map((p) => p.id)).toEqual(IDS);
      expect(positions.map((p) => [p.from, p.to])).toEqual(spec.ranges);
      for (const [i, position] of positions.entries()) {
        const counted = independentlyCount(scale.slug, ...spec.ranges[i] as [number, number]);
        expect(counted.map((row) => row.join(' ')).join('|')).toBe(spec.expected[i]);
        expect(position.strings.map((tones) => tones.map((t) => `${t.fret}:${t.note}/${t.degree}`))).toEqual(counted);
      }
    }
    for (const page of generator.renderScalePages()) {
      const spec = SPEC[page.slug];
      IDS.forEach((id, i) => {
        const actual = rowsOf(page.html, `position-${id}`).map(([string, frets, notes, degrees], row) => {
          expect(string).toBe(String(6 - row));
          const split = (value: string) => value.split(/<br\s*\/?>/);
          const f = split(frets), n = split(notes), d = split(degrees);
          expect(n).toHaveLength(f.length);
          expect(d).toHaveLength(f.length);
          return f.map((fret, k) => `${fret}:${n[k]}/${d[k]}`).join(' ');
        }).join('|');
        expect(actual).toBe(spec.expected[i]);
      });
      const diagrams = [...page.html.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g)];
      const ranges = [[0, 12], ...spec.ranges];
      diagrams.forEach((diagram, i) => {
        const markers = [...diagram[1].matchAll(/<g data-string="(\d)" data-tone="([^"]+)"/g)];
        const counted = independentlyCount(page.slug, ...ranges[i] as [number, number]);
        expect(markers.map((m) => `${m[1]}:${m[2]}`)).toEqual(
          counted.flatMap((tones, row) => tones.map((tone) => `${6 - row}:${tone}`)));
      });
    }
  });

  it('checks every root fret in the 12-key transfer table independently', async () => {
    const { generator } = await load();
    const keys = ['C', 'C♯/D♭', 'D', 'E♭', 'E', 'F', 'F♯/G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
    for (const page of generator.renderScalePages()) {
      const rows = rowsOf(page.html, 'transfer');
      expect(rows).toHaveLength(12);
      rows.forEach(([key, sixth, fifth], pc) => {
        expect(key).toBe(keys[pc]);
        [sixth, fifth].forEach((cell, index) => {
          const matches = Array.from({ length: 12 }, (_, fret) => fret)
            .filter((fret) => (OPEN[index] + fret) % 12 === pc);
          expect(matches).toHaveLength(1);
          expect(cell).toBe(matches[0] === 0 ? '0 / 12' : String(matches[0]));
        });
      });
    }
  });

  it('stops on missing degrees, out-of-scale notes, and invalid root frets', async () => {
    const { data, generator } = await load();
    const scale = data.SCALES[0];
    for (const anchor of ['r5', 'r6'] as const) {
      for (const fret of [-1, 12, 1]) {
        expect(() => generator.positionsOf({ ...scale, rootFrets: { ...scale.rootFrets, [anchor]: fret } })).toThrow();
      }
    }
    const narrow = { ...scale, positions: [{ id: 'incomplete', range: [0, 0] }] };
    expect(() => generator.positionsOf(narrow)).toThrow(/seven degrees/);
    const position = generator.positionsOf(scale)[0];
    const broken = structuredClone(position);
    broken.strings[0][0] = { fret: 2, midi: 42, note: 'F♯', degree: '3' };
    expect(() => generator.validatePosition(scale, broken)).toThrow(/out-of-scale/);
  });

  it('generated files match script output and expose bilingual static metadata', async () => {
    const { generator } = await load();
    expect(generator.SCALE_SLUGS).toEqual(['c-major', 'dorian']);
    const pages = generator.renderScalePages();
    expect(pages.map((p) => p.path)).toEqual([
      'scales/c-major/index.html', 'en/scales/c-major/index.html',
      'scales/dorian/index.html', 'en/scales/dorian/index.html',
    ]);
    for (const page of pages) {
      expect(readFileSync(resolve(page.path), 'utf8').replace(/\r\n/g, '\n'),
        `${page.path}: run node scripts/generate-scale-pages.mjs`).toBe(page.html);
      checkPage(page.html, page.slug, page.language);
    }
  });
});

describe.runIf(existsSync(resolve('dist/fretboard/index.html')))('built scale pages', () => {
  it('retains metadata, language links, and the appropriate manifest', () => {
    for (const slug of ['c-major', 'dorian']) {
      for (const language of ['ja', 'en'] as const) {
        const relative = `${language === 'en' ? 'en/' : ''}scales/${slug}/index.html`;
        const html = readFileSync(resolve('dist/fretboard', relative), 'utf8');
        checkPage(html, slug, language);
        expect(html).toContain('href="/fretboard/favicon.svg"');
        expect(html).toContain(`href="/fretboard/${language === 'en' ? 'en/' : ''}manifest.webmanifest"`);
      }
    }
  });
});
