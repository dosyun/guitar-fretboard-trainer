import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCALES, COPY } from './scale-pages/scales.mjs';

const SITE = 'https://guitartoolbox.site';
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const KEYS = ['C', 'C♯/D♭', 'D', 'E♭', 'E', 'F', 'F♯/G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Unknown placeholder: ${key}`);
  return values[key];
});
const rootFret = (pc, index) => (pc - OPEN_MIDI[index] % 12 + 12) % 12;
const pathFor = (slug, language) => `${language === 'en' ? 'en/' : ''}scales/${slug}/`;
const table = (id, headers, rows) => `<div class="table-wrap"><table id="${id}">
<thead><tr>${headers.map((h) => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('\n')}</tbody>
</table></div>`;

function notesIn(scale, from, to) {
  return OPEN_MIDI.map((open) => Array.from({ length: to - from + 1 }, (_, k) => {
    const fret = from + k;
    const midi = open + fret;
    const semitones = (midi % 12 - scale.root + 12) % 12;
    const degreeIndex = scale.intervals.indexOf(semitones);
    return degreeIndex < 0 ? null : { fret, midi, note: NOTES[midi % 12], degree: scale.degrees[degreeIndex] };
  }).filter((tone) => tone !== null));
}

export function validatePosition(scale, position) {
  const { from, to, strings } = position;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to > 12 || to < from || strings.length !== 6) {
    throw new Error(`${scale.slug}: invalid position range`);
  }
  const found = new Set();
  strings.forEach((tones, index) => {
    const expected = notesIn(scale, from, to)[index];
    if (tones.length !== expected.length) throw new Error(`${scale.slug}: missing or extra notes`);
    tones.forEach((tone, k) => {
      const midi = OPEN_MIDI[index] + tone.fret;
      const interval = (midi % 12 - scale.root + 12) % 12;
      const degree = scale.degrees[scale.intervals.indexOf(interval)];
      if (!Number.isInteger(tone.fret) || tone.fret < from || tone.fret > to ||
          !degree || tone.degree !== degree || tone.note !== NOTES[midi % 12] ||
          tone.midi !== midi || tone.fret !== expected[k].fret) {
        throw new Error(`${scale.slug}: out-of-scale or inconsistent note`);
      }
      found.add(tone.degree);
    });
  });
  if (found.size !== 7 || scale.degrees.some((degree) => !found.has(degree))) {
    throw new Error(`${scale.slug}: position lacks one of the seven degrees`);
  }
}

export function positionsOf(scale) {
  if (!Number.isInteger(scale.root) || scale.root < 0 || scale.root > 11 ||
      scale.intervals.length !== 7 || scale.degrees.length !== 7 ||
      new Set(scale.intervals).size !== 7 || new Set(scale.degrees).size !== 7 ||
      scale.intervals[0] !== 0 || scale.degrees[0] !== 'R' ||
      scale.intervals.some((n, i, all) => !Number.isInteger(n) || n < 0 || n > 11 || (i > 0 && n <= all[i - 1]))) {
    throw new Error(`${scale.slug}: invalid scale`);
  }
  for (const [anchor, index] of [['r5', 1], ['r6', 0]]) {
    const fret = scale.rootFrets[anchor];
    if (!Number.isInteger(fret) || fret < 0 || fret > 11 || fret !== rootFret(scale.root, index)) {
      throw new Error(`${scale.slug}: ${anchor} out of range or not a root`);
    }
  }
  return scale.positions.map((definition) => {
    const [from, to] = definition.range ??
      definition.offsets.map((offset) => scale.rootFrets[definition.anchor] + offset);
    const position = { id: definition.id, from, to, strings: notesIn(scale, from, to) };
    validatePosition(scale, position);
    return position;
  });
}

function diagram(scale, position, language) {
  const copy = COPY[language];
  const { from, to, strings } = position;
  const width = 100 + (to - from + 1) * 64;
  const xOf = (fret) => 66 + (fret - from) * 64;
  const yOf = (index) => 42 + (5 - index) * 64;
  const parts = [`<rect x="40" y="20" width="${width - 50}" height="370" fill="#271e16" />`];
  for (let fret = from; fret <= to; fret++) {
    const x = xOf(fret);
    parts.push(`<line class="fret" x1="${x + 32}" y1="20" x2="${x + 32}" y2="390" />`);
    parts.push(`<text x="${x}" y="432">${fret}</text>`);
  }
  strings.forEach((tones, index) => {
    const y = yOf(index);
    parts.push(`<line class="string" x1="40" y1="${y}" x2="${width - 10}" y2="${y}" />`);
    parts.push(`<text x="16" y="${y + 5}">${6 - index}</text>`);
    for (const tone of tones) {
      const x = xOf(tone.fret);
      parts.push(`<g data-string="${6 - index}" data-tone="${tone.fret}:${tone.note}/${tone.degree}">
<circle class="${tone.degree === 'R' ? 'root-dot' : 'dot'}" cx="${x}" cy="${y}" r="19" />
<text class="${tone.degree === 'R' ? 'root-text' : 'degree'}" x="${x}" y="${y + 5}">${escapeHtml(tone.degree)}</text>
<text x="${x}" y="${y + 39}">${escapeHtml(tone.note)}</text></g>`);
    }
  });
  const label = fill(copy.diagram, { name: scale[language].name, from, to });
  return `<div class="diagram-wrap" tabindex="0" role="region" aria-label="${escapeHtml(label)}"><svg class="diagram" width="${width}" height="448" viewBox="0 0 ${width} 448" role="img" aria-label="${escapeHtml(label)}">${parts.join('\n')}</svg></div>`;
}

const CSS = `
:root { color-scheme:dark; --bg:#121315; --surface:#1f2124; --panel:#2a2d31; --glass:#0a0b0c; --hair:#34373c; --case-edge:#3d4147; --ink:#ebe7df; --dim:#979aa0; --accent:#ffb02e; }
* { box-sizing:border-box; }
body { margin:0; min-height:100dvh; background:var(--bg); color:var(--ink); font:16px/1.8 system-ui,sans-serif; }
.guide { max-width:50rem; margin:auto; padding:24px 24px 48px; }
a { color:var(--accent); text-underline-offset:3px; }
a:focus-visible, [tabindex]:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
.crumbs, .language { font-size:14px; color:var(--dim); }
.crumbs ol { display:flex; flex-wrap:wrap; gap:8px; list-style:none; padding:0; }
.crumbs li + li::before { content:"›"; margin-right:8px; }
h1 { font-size:20px; line-height:1.5; margin:24px 0 16px; }
h2 { font-size:16px; line-height:1.5; margin:32px 0 12px; padding-top:24px; border-top:1px solid var(--hair); }
h3 { font-size:16px; margin:24px 0 8px; }
p { margin:0 0 16px; }
p, li, h1, td, th, dt, dd { overflow-wrap:anywhere; }
.table-wrap, .diagram-wrap { max-width:100%; overflow-x:auto; margin-bottom:16px; border:1px solid var(--hair); border-radius:8px; }
table { width:100%; border-collapse:collapse; font-size:14px; line-height:1.6; }
th, td { padding:8px 12px; text-align:left; vertical-align:top; border-bottom:1px solid var(--hair); }
th { background:var(--surface); color:var(--dim); font-weight:600; }
td { font-family:ui-monospace,monospace; font-variant-numeric:tabular-nums; }
.diagram-wrap { background:var(--glass); }
.diagram { display:block; max-width:none; }
.diagram text { fill:var(--ink); font:14px ui-monospace,monospace; text-anchor:middle; }
.diagram .fret { stroke:#776b5b; }
.diagram .string { stroke:#a19b92; }
.diagram .dot { fill:var(--panel); stroke:var(--dim); }
.diagram .root-dot { fill:var(--accent); }
.diagram .root-text { fill:var(--bg); }
.cta { display:inline-flex; align-items:center; min-height:48px; padding:8px 24px; border-radius:8px; background:var(--accent); color:var(--bg); font-weight:600; text-decoration:none; }
dt { font-weight:600; margin-top:16px; }
dd { margin:4px 0 0; }
.next { margin-top:48px; padding:16px 24px; background:var(--surface); border:1px solid var(--hair); border-top-color:var(--case-edge); border-radius:16px; }
.next h2 { margin-top:0; padding-top:0; border:0; }
@media(max-width:480px) { .guide { padding:16px 16px 32px; } th,td { padding:8px; } .next { padding:16px; } }
`;

function renderPage(scale, language, positions) {
  const copy = COPY[language], text = scale[language];
  const path = pathFor(scale.slug, language), url = `${SITE}/fretboard/${path}`;
  const tool = `/fretboard/${language === 'en' ? 'en/' : ''}`;
  const otherLanguage = language === 'ja' ? 'en' : 'ja';
  const image = `${SITE}/fretboard/og-image${language === 'en' ? '-en' : ''}.png`;
  const values = {
    notes: scale.intervals.map((n) => NOTES[(scale.root + n) % 12]).join(' '),
    root: NOTES[scale.root], ...scale.rootFrets, a6: rootFret(9, 0),
  };
  const paragraph = (value) => `<p>${escapeHtml(fill(value, values))}</p>`;
  const toneRows = scale.intervals.map((n, i) => [
    NOTES[(scale.root + n) % 12],
    `${escapeHtml(scale.degrees[i])} (${escapeHtml(copy.degreeNames[scale.degrees[i]])})`, n,
  ]);
  const positionSections = positions.map((position, index) => {
    const rows = position.strings.map((tones, i) => [
      6 - i, ...['fret', 'note', 'degree'].map((key) => tones.map((tone) => escapeHtml(tone[key])).join('<br />')),
    ]);
    return `<section id="${position.id}"><h3>${escapeHtml(copy.positionNames[index])} (${position.from}–${position.to})</h3>
${diagram(scale, position, language)}
${table(`position-${position.id}`, copy.stringHeaders, rows)}</section>`;
  }).join('\n');
  const transferRows = KEYS.map((key, pc) => [escapeHtml(key), ...[0, 1].map((index) => {
    const fret = rootFret(pc, index);
    return fret === 0 ? '0 / 12' : String(fret);
  })]);
  const organization = { '@type': 'Organization', name: 'Guitar Toolbox', url: `${SITE}/` };
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: text.title,
    description: text.description, inLanguage: language, url, mainEntityOfPage: url, image,
    datePublished: '2026-11-17', dateModified: '2026-11-17', author: organization, publisher: organization,
  };
  const breadcrumbItems = [
    ['Guitar Toolbox', `${SITE}/${language === 'en' ? 'en/' : ''}`],
    [copy.tool, `${SITE}${tool}`], [text.name, url],
  ];
  const breadcrumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
  };
  const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');
  const alternates = ['ja', 'en', 'x-default'].map((lang) =>
    `<link rel="alternate" hreflang="${lang}" href="${SITE}/fretboard/${pathFor(scale.slug, lang === 'ja' ? 'ja' : 'en')}" />`).join('\n');
  const next = SCALES.filter((other) => other.slug !== scale.slug).map((other) =>
    `<li><a href="/fretboard/${pathFor(other.slug, language)}">${escapeHtml(other[language].name)}</a></li>`);
  if (language === 'ja') next.push(
    '<li><a href="/theory/modes/">モードの理論</a></li>',
    '<li><a href="/theory/major-minor-scale/">メジャーとマイナーの理論</a></li>',
    '<li><a href="/fretboard/guides/memorize-fretboard/">指板の音名の覚え方</a></li>',
  );
  next.push(`<li><a href="${tool}">${escapeHtml(copy.tool)}</a></li>`);
  const overview = { id: 'overview', from: 0, to: 12, strings: notesIn(scale, 0, 12) };
  validatePosition(scale, overview);
  return `<!doctype html>
<!-- Generated by scripts/generate-scale-pages.mjs. Edit scripts/scale-pages/scales.mjs and regenerate. -->
<html lang="${language}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />
<meta name="theme-color" content="#121315" />
<title>${escapeHtml(text.title)}</title>
<meta name="description" content="${escapeHtml(text.description)}" />
<link rel="canonical" href="${url}" />
${alternates}
<meta property="og:url" content="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Guitar Toolbox" />
<meta property="og:title" content="${escapeHtml(text.title)}" />
<meta property="og:description" content="${escapeHtml(text.description)}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${language === 'en' ? 'en_US' : 'ja_JP'}" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${json(article)}</script>
<script type="application/ld+json">${json(breadcrumbs)}</script>
<style>${CSS}</style>
</head>
<body>
<main class="guide">
<nav class="language" aria-label="${copy.language}"><a href="/fretboard/${pathFor(scale.slug, otherLanguage)}" lang="${otherLanguage}" hreflang="${otherLanguage}">${copy.switch}</a></nav>
<nav class="crumbs" aria-label="${copy.crumbs}"><ol>${breadcrumbItems.map(([name, item], i) => `<li>${i < 2 ? `<a href="${item}">${escapeHtml(name)}</a>` : escapeHtml(name)}</li>`).join('')}</ol></nav>
<article>
<h1>${escapeHtml(text.title)}</h1>
${paragraph(text.lead)}
<h2>${copy.tones}</h2>
${table('tones', copy.headers, toneRows)}
${paragraph(text.comparison)}
<h2>${copy.overview}</h2>
<p>${copy.legend}</p>
${diagram(scale, overview, language)}
<h2>${copy.positions}</h2>
${positionSections}
<h2>${copy.transfer}</h2>
${paragraph(text.transfer)}
${table('transfer', copy.transferHeaders, transferRows)}
<h2>${copy.practice}</h2>
<p>${copy.instructions}</p>
<p><a class="cta" href="${tool}">${copy.button}</a></p>
<h2>${copy.faq}</h2>
<dl>${text.faq.map(([q, a]) => `<dt>${escapeHtml(q)}</dt><dd>${escapeHtml(fill(a, values))}</dd>`).join('\n')}</dl>
</article>
<section class="next" aria-labelledby="next-heading"><h2 id="next-heading">${copy.next}</h2><ul>${next.join('\n')}</ul></section>
</main>
</body>
</html>
`;
}

export function renderScalePages() {
  return SCALES.flatMap((scale) => {
    const positions = positionsOf(scale);
    return ['ja', 'en'].map((language) => ({
      slug: scale.slug, language, path: `${pathFor(scale.slug, language)}index.html`,
      html: renderPage(scale, language, positions),
    }));
  });
}

export const SCALE_SLUGS = SCALES.map((scale) => scale.slug);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const page of renderScalePages()) {
    const file = new URL(`../${page.path}`, import.meta.url);
    mkdirSync(new URL('.', file), { recursive: true });
    writeFileSync(file, page.html);
    console.log(`wrote ${page.path}`);
  }
}
