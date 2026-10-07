import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

describe('static bilingual discovery', () => {
  for (const [file, language, url, hub, other] of [
    ['index.html', 'ja', 'https://guitartoolbox.site/fretboard/', 'https://guitartoolbox.site/', 'https://guitartoolbox.site/fretboard/en/'],
    ['en/index.html', 'en', 'https://guitartoolbox.site/fretboard/en/', 'https://guitartoolbox.site/en/', 'https://guitartoolbox.site/fretboard/'],
  ]) {
    it(file + ' is discoverable before JavaScript runs', () => {
      const html = readFileSync(resolve(file), 'utf8');
      expect(html).toContain('<html lang="' + language + '">');
      expect(html).toContain('rel="canonical" href="' + url + '"');
      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
        .map((match) => [match[1], match[2]]);
      expect(alternates).toEqual([
        ['ja', 'https://guitartoolbox.site/fretboard/'],
        ['en', 'https://guitartoolbox.site/fretboard/en/'],
        ['x-default', 'https://guitartoolbox.site/fretboard/en/'],
      ]);
      const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      expect(json).toBeDefined();
      expect(JSON.parse(json!)).toMatchObject({
        '@type': 'WebApplication', name: 'Guitar Fretboard Trainer',
        url, inLanguage: language, applicationCategory: 'EducationalApplication',
        operatingSystem: 'Any', offers: { price: '0' },
      });
      expect(html).toContain('<a href="' + hub + '"');
      expect(html).toContain('<a href="' + other + '"');
    });
  }

  it('generates four sitemap URLs with three reciprocal language links each', async () => {
    const generator = await import(pathToFileURL(resolve('scripts/generate-sitemap.mjs')).href);
    const xml: string = generator.renderSitemap();
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
    expect(urls).toHaveLength(4);
    const pages = ['', '', 'ear-training/', 'ear-training/'];
    urls.forEach((entry, i) => {
      const page = pages[i];
      const loc = i % 2 === 0 ? `fretboard/${page}` : `fretboard/en/${page}`;
      expect(entry).toContain(`<loc>https://guitartoolbox.site/${loc}</loc>`);
      expect([...entry.matchAll(/<xhtml:link /g)]).toHaveLength(3);
      expect(entry).toContain(`hreflang="ja" href="https://guitartoolbox.site/fretboard/${page}"`);
      expect(entry).toContain(`hreflang="en" href="https://guitartoolbox.site/fretboard/en/${page}"`);
      expect(entry).toContain(`hreflang="x-default" href="https://guitartoolbox.site/fretboard/en/${page}"`);
    });
  });
});

describe.runIf(existsSync(resolve('dist/fretboard/index.html')))('built bilingual PWA', () => {
  it('emits both entry points, the English manifest, shared precache, and sitemap', () => {
    for (const page of ['index.html', 'en/index.html']) {
      const html = readFileSync(resolve('dist/fretboard', page), 'utf8');
      const expected = 'https://guitartoolbox.site/fretboard/' + (page.startsWith('en/') ? 'en/' : '');
      expect(html).toContain('rel="canonical" href="' + expected + '"');
      expect([...html.matchAll(/rel="manifest"/g)]).toHaveLength(1);
    }
    const manifest = JSON.parse(readFileSync(resolve('dist/fretboard/en/manifest.webmanifest'), 'utf8'));
    expect(manifest).toMatchObject({ lang: 'en', start_url: '/fretboard/en/', id: '/fretboard/en/', scope: '/fretboard/' });
    expect(manifest.description).not.toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
    for (const icon of manifest.icons) expect(icon.src).toMatch(/^\/fretboard\/[^/]+$/);
    const sw = readFileSync(resolve('dist/fretboard/sw.js'), 'utf8');
    expect(sw).toContain('en/index.html');
    expect(sw).toContain('en/manifest.webmanifest');
    const sitemap = readFileSync(resolve('dist/fretboard/sitemap.xml'), 'utf8');
    expect([...sitemap.matchAll(/<url>/g)]).toHaveLength(4);
    expect([...sitemap.matchAll(/<xhtml:link /g)]).toHaveLength(12);
  });
});
