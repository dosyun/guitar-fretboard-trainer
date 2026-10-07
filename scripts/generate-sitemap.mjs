import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function renderSitemap() {
  const urls = ['', 'ear-training/'].flatMap((page) => {
    const languages = [
      ['ja', `https://guitartoolbox.site/fretboard/${page}`],
      ['en', `https://guitartoolbox.site/fretboard/en/${page}`],
      ['x-default', `https://guitartoolbox.site/fretboard/en/${page}`],
    ];
    const links = languages.map(([language, url]) =>
      `    <xhtml:link rel="alternate" hreflang="${language}" href="${url}" />`).join('\n');
    return languages.slice(0, 2).map(([, url]) =>
      `  <url>\n    <loc>${url}</loc>\n${links}\n  </url>`);
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../dist/fretboard/sitemap.xml', import.meta.url), renderSitemap());
}
