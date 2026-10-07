import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ja = 'https://guitartoolbox.site/fretboard/ear-training/';
const en = 'https://guitartoolbox.site/fretboard/en/ear-training/';

describe('ear training discovery without JavaScript', () => {
  for (const [file, language, url] of [
    ['ear-training/index.html', 'ja', ja],
    ['en/ear-training/index.html', 'en', en],
  ]) {
    it(file + ' exposes dedicated metadata and persistent instructions', () => {
      const html = readFileSync(resolve(file), 'utf8');
      expect(html).toContain('<html lang="' + language + '">');
      expect(html).toContain('rel="canonical" href="' + url + '"');
      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((match) => [match[1], match[2]]);
      expect(alternates).toEqual([['ja', ja], ['en', en], ['x-default', en]]);
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
      expect(title).toMatch(language === 'ja' ? /耳コピ/ : /Guitar Ear Training/);
      expect(html).toContain('property="og:title" content="' + title + '"');
      const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
      expect(description).toBeTruthy();
      expect(html).toContain('property="og:description" content="' + description + '"');
      const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      expect(JSON.parse(json!)).toMatchObject({
        '@type': 'WebApplication', url, inLanguage: language,
        applicationCategory: 'EducationalApplication', offers: { price: '0' },
      });
      // The prose is outside React's mount point, so rendering does not remove it.
      const section = html.match(/<div id="root"><\/div>\s*(<section[\s\S]*?<\/section>)/)?.[1];
      expect(section).toBeDefined();
      expect([...section!.matchAll(/<h1\b/g)]).toHaveLength(1);
      const body = [...section!.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]).join(' ');
      const length = language === 'ja' ? body.replace(/\s/g, '').length : body.split(/\s+/).length;
      expect(length).toBeGreaterThanOrEqual(300);
      expect(length).toBeLessThanOrEqual(500);
      if (language === 'en') expect(section).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
    });
  }

  it('generates four URLs with alternates pointing to the corresponding feature', async () => {
    const generator = await import(pathToFileURL(resolve('scripts/generate-sitemap.mjs')).href);
    const xml: string = generator.renderSitemap();
    const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.match(/<loc>([^<]+)<\/loc>/)?.[1])).toEqual([
      'https://guitartoolbox.site/fretboard/', 'https://guitartoolbox.site/fretboard/en/', ja, en,
    ]);
    for (const [index, entry] of entries.entries()) {
      const links = [...entry.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((match) => [match[1], match[2]]);
      expect(links).toEqual(index < 2 ? [
        ['ja', 'https://guitartoolbox.site/fretboard/'],
        ['en', 'https://guitartoolbox.site/fretboard/en/'],
        ['x-default', 'https://guitartoolbox.site/fretboard/en/'],
      ] : [['ja', ja], ['en', en], ['x-default', en]]);
    }
  });
});

describe.runIf(existsSync(resolve('dist/fretboard/index.html')))('built ear training entries', () => {
  it('emits both dedicated pages and precaches them for their own navigation URLs', () => {
    const sw = readFileSync(resolve('dist/fretboard/sw.js'), 'utf8');
    for (const [file, url, manifest] of [
      ['ear-training/index.html', ja, '/fretboard/manifest.webmanifest'],
      ['en/ear-training/index.html', en, '/fretboard/en/manifest.webmanifest'],
    ]) {
      const html = readFileSync(resolve('dist/fretboard', file), 'utf8');
      expect(html).toContain('rel="canonical" href="' + url + '"');
      expect(html).toContain('href="' + manifest + '"');
      expect([...html.matchAll(/rel="manifest"/g)]).toHaveLength(1);
      expect(html).toContain('class="ear-training-intro"');
      expect(sw).toContain(file);
    }
  });
});
