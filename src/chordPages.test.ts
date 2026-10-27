import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type Fret = number | 'x';
interface Form { id: string; frets: Fret[] }
interface Chord { slug: string; name: string; forms: Form[]; related: { name: string; frets: Fret[] }[] }

const load = async () => ({
  data: await import(pathToFileURL(resolve('scripts/chord-pages/chords.mjs')).href) as { CHORDS: Chord[] },
  generator: await import(pathToFileURL(resolve('scripts/generate-chord-pages.mjs')).href) as {
    renderChordPages: () => { slug: string; path: string; html: string }[];
  },
});

// 生成スクリプトとは別に、開放弦の音（6弦→1弦: E A D G B E）から鳴る音を数える。
const OPEN_PC = [4, 9, 2, 7, 11, 4];
const PC: Record<string, number> = {
  C: 0, 'C♯': 1, D: 2, 'E♭': 3, E: 4, F: 5, 'F♯': 6, G: 7, 'A♭': 8, A: 9, 'B♭': 10, B: 11,
};
const pcAt = (index: number, fret: Fret) => (fret === 'x' ? null : (OPEN_PC[index] + fret) % 12);

// 押さえ方ごとに、6弦→1弦で鳴る音（手で数えた期待値。'-' は鳴らさない弦）。
const EXPECTED: Record<string, string> = {
  'f full-barre': 'F C F A C F',
  'f two-string-barre': '- - F A C F',
  'f thumb': 'F - F A C F',
  'g three-finger-a': 'G B D G B G',
  'g three-finger-b': 'G B D G B G',
  'g four-finger': 'G B D G D G',
  'c open': '- C E G C E',
  'd open': '- - D A D F♯',
  'd index-barre': '- - D A D F♯',
  'f FM7': '- - F A C E',
  'f Fadd9': '- - F A C G',
  'g G7': 'G B D G B F',
  'g GM7': 'G B D G B F♯',
  'c CM7': '- C E G B E',
  'c C7': '- C E B♭ C E',
  'c Cadd9': '- C E G D E',
  'd Dsus4': '- - D A D G',
  'd Dsus2': '- - D A D E',
  'd D7': '- - D A C F♯',
  'd DM7': '- - D A C♯ F♯',
};

describe('chord pages (/fretboard/chords/<slug>/)', () => {
  it('every form and related chord sounds the hand-counted notes', async () => {
    const { data } = await load();
    const checked: string[] = [];
    for (const chord of data.CHORDS) {
      const shapes = [...chord.forms.map((f) => [f.id, f.frets] as const), ...chord.related.map((r) => [r.name, r.frets] as const)];
      for (const [id, frets] of shapes) {
        const key = `${chord.slug} ${id}`;
        const expected = EXPECTED[key]?.split(' ');
        expect(expected, key).toBeDefined();
        expect(frets.map((fret, index) => pcAt(index, fret)), key)
          .toEqual(expected!.map((name) => (name === '-' ? null : PC[name])));
        checked.push(key);
      }
    }
    expect(checked.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it('committed HTML matches the generator output', async () => {
    const { generator } = await load();
    const pages = generator.renderChordPages();
    expect(pages.map((page) => page.slug)).toEqual(['f', 'g', 'c', 'd']);
    for (const page of pages) {
      expect(readFileSync(resolve(page.path), 'utf8'), `${page.path} is stale: run node scripts/generate-chord-pages.mjs`).toBe(page.html);
    }
  });

  it('each page is a Japanese-only static page with one h1 and links to the other chords', async () => {
    const { generator } = await load();
    for (const page of generator.renderChordPages()) {
      const { html, slug } = page;
      const url = `https://guitartoolbox.site/fretboard/chords/${slug}/`;
      expect(html).toContain('<html lang="ja">');
      expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1);
      expect(html).toContain(`rel="canonical" href="${url}"`);
      expect(html).not.toContain('hreflang=');
      expect(html).not.toContain('[NEED');
      expect(html).not.toContain('src="/src/');
      expect([...html.matchAll(/<svg class="diagram"/g)].length).toBeGreaterThan(0);
      for (const other of ['f', 'g', 'c', 'd'].filter((s) => s !== slug)) {
        expect(html).toContain(`href="/fretboard/chords/${other}/"`);
      }
      for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        expect(() => JSON.parse(match[1])).not.toThrow();
      }
    }
  });
});

describe.runIf(existsSync(resolve('dist/fretboard/index.html')))('built chord pages', () => {
  it('emits every chord page with its canonical URL', () => {
    for (const slug of ['f', 'g', 'c', 'd']) {
      const html = readFileSync(resolve('dist/fretboard/chords', slug, 'index.html'), 'utf8');
      expect(html).toContain(`rel="canonical" href="https://guitartoolbox.site/fretboard/chords/${slug}/"`);
      expect(html).toContain('href="/fretboard/favicon.svg"');
    }
  });
});
