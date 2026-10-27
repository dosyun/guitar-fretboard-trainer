// コード別の押さえ方ページを chords/<slug>/index.html に書き出す。
// 実行: node scripts/generate-chord-pages.mjs（生成物はリポジトリに入れ、Vite の入力にする）
// src/chordPages.test.ts が、生成物とこの出力の一致と、鳴る音がすべて構成音であることを確かめる。
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHORDS } from './chord-pages/chords.mjs';

const SITE = 'https://guitartoolbox.site';
// 標準チューニングの開放弦（MIDI ノート番号）。[6弦, 5弦, 4弦, 3弦, 2弦, 1弦]
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DEGREE_SEMITONES = { R: 0, 2: 2, 9: 2, 3: 4, 4: 5, 5: 7, '♭7': 10, 7: 11 };
const DEGREE_LABEL = { R: 'ルート', 2: '長2度', 9: '9度', 3: '長3度', 4: '完全4度', 5: '完全5度', '♭7': '短7度', 7: '長7度' };
const FINGER_LABEL = { 1: '人差し指', 2: '中指', 3: '薬指', 4: '小指', T: '親指' };
const FINGER_MARK = { 1: '1', 2: '2', 3: '3', 4: '4', T: '親' };

const stringNo = (index) => 6 - index;

export function pitchClassOf(name) {
  const base = LETTER_PC[name[0]];
  if (base === undefined) throw new Error(`Unknown note name: ${name}`);
  const accidental = name.slice(1);
  const shift = accidental === '♯' ? 1 : accidental === '♭' ? -1 : accidental === '' ? 0 : NaN;
  if (Number.isNaN(shift)) throw new Error(`Unknown accidental: ${name}`);
  return (base + shift + 12) % 12;
}

/** 弦（0=6弦）とフレットから鳴る音の MIDI 番号を返す。鳴らさない弦は null。 */
export function midiAt(index, fret) {
  return fret === 'x' ? null : OPEN_MIDI[index] + fret;
}

function checkTone(root, tone, chordName) {
  const interval = (pitchClassOf(tone.name) - pitchClassOf(root.name) + 12) % 12;
  if (DEGREE_SEMITONES[tone.degree] !== interval) {
    throw new Error(`${chordName}: ${tone.name} is not the ${tone.degree} of ${root.name}`);
  }
}

/** フレットの並びから、各弦で鳴る音（構成音のどれか）を返す。構成音にない音が出たら止める。 */
export function soundsOf(frets, tones, label) {
  if (frets.length !== 6) throw new Error(`${label}: frets must list 6 strings`);
  return frets.map((fret, index) => {
    const midi = midiAt(index, fret);
    if (midi === null) return null;
    const tone = tones.find((t) => pitchClassOf(t.name) === midi % 12);
    if (!tone) throw new Error(`${label}: string ${stringNo(index)} fret ${fret} is not a chord tone`);
    return { ...tone, midi };
  });
}

export function validateChord(chord) {
  const [root] = chord.tones;
  for (const tone of chord.tones) checkTone(root, tone, chord.name);
  for (const form of chord.forms) {
    const label = `${chord.name} ${form.id}`;
    const sounds = soundsOf(form.frets, chord.tones, label);
    form.frets.forEach((fret, index) => {
      const finger = form.fingers[index];
      if ((fret === 'x') !== (finger === 'x') || (fret === 0) !== (finger === 0)) {
        throw new Error(`${label}: finger and fret disagree on string ${stringNo(index)}`);
      }
      if (fret !== 'x' && fret !== 0 && !FINGER_LABEL[finger]) throw new Error(`${label}: unknown finger ${finger}`);
    });
    if (form.barre) {
      const { fret, from, to, finger } = form.barre;
      for (let n = from; n >= to; n--) {
        const index = 6 - n;
        const pressed = form.frets[index];
        if (pressed === 'x' || pressed < fret) throw new Error(`${label}: barre cannot cover string ${n}`);
        if (pressed === fret && form.fingers[index] !== finger) throw new Error(`${label}: barre finger mismatch on string ${n}`);
      }
    }
    for (const tone of chord.tones) {
      if (!sounds.some((s) => s && s.name === tone.name)) throw new Error(`${label}: ${tone.name} is missing`);
    }
  }
  for (const related of chord.related) {
    const base = chord.forms.find((f) => f.id === related.base);
    if (!base) throw new Error(`${related.name}: unknown base form`);
    checkTone(root, related.extra, related.name);
    const tones = [...chord.tones, related.extra];
    const sounds = soundsOf(related.frets, tones, related.name);
    if (!sounds.some((s) => s && s.name === related.extra.name)) throw new Error(`${related.name}: ${related.extra.name} does not sound`);
    if (changesOf(base.frets, related.frets).length !== 1) throw new Error(`${related.name}: must change exactly one string`);
  }
}

function changesOf(from, to) {
  return from.flatMap((fret, index) => (fret === to[index] ? [] : [{ index, from: fret, to: to[index] }]));
}

const escapeHtml = (text) => String(text)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const placeOf = (fret) => (fret === 'x' ? '鳴らさない' : fret === 0 ? '開放' : `${fret}フレット`);
const noteText = (tone) => `${tone.name}（${tone.solfege}）`;

function lowestOf(sounds) {
  let lowest = null;
  sounds.forEach((sound, index) => {
    if (sound && (!lowest || sound.midi < lowest.sound.midi)) lowest = { sound, index };
  });
  return lowest;
}

function fingersUsed(form) {
  return new Set(form.fingers.filter((f) => f !== 0 && f !== 'x')).size;
}

/** 鳴らす弦を「1〜4弦と6弦」のように、続いている弦ごとにまとめて書く。 */
function soundingStrings(frets) {
  const sounding = frets.map((f, index) => (f === 'x' ? null : stringNo(index))).filter((n) => n !== null).sort((a, b) => a - b);
  if (sounding.length === 6) return '全6本';
  const runs = [];
  for (const n of sounding) {
    const last = runs.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  return runs.map(([a, b]) => (a === b ? `${a}弦` : `${a}〜${b}弦`)).join('と');
}

function stringDescription(form, index) {
  const fret = form.frets[index];
  const n = stringNo(index);
  if (fret === 'x') return `${n}弦は鳴らさない`;
  if (fret === 0) return `${n}弦は開放`;
  return `${n}弦${fret}フレットを${FINGER_LABEL[form.fingers[index]]}`;
}

/** 横向きの指板図（上が1弦、左がナット）。丸の中は指、右端はその弦で鳴る音名。 */
export function renderDiagram(chord, form) {
  const sounds = soundsOf(form.frets, chord.tones, form.id);
  const pressed = form.frets.filter((f) => f !== 'x' && f > 0);
  const start = Math.max(...pressed, 0) <= 4 ? 1 : Math.min(...pressed);
  const top = 24, gap = 28, nutX = 76, fretW = 64, frets = 4;
  const yOf = (index) => top + (5 - index) * gap; // index 5（1弦）が上
  const xOf = (fret) => nutX + (fret - start + 0.5) * fretW;
  const parts = [];
  for (let k = 0; k <= frets; k++) {
    const x = nutX + k * fretW;
    parts.push(`<line class="${k === 0 && start === 1 ? 'dg-nut' : 'dg-fret'}" x1="${x}" y1="${top}" x2="${x}" y2="${top + 5 * gap}" />`);
  }
  for (let index = 0; index < 6; index++) {
    const y = yOf(index);
    parts.push(`<line class="dg-string" x1="${nutX}" y1="${y}" x2="${nutX + frets * fretW}" y2="${y}" stroke-width="${index < 3 ? 2 : 1}" />`);
    parts.push(`<text class="dg-label" x="28" y="${y}">${stringNo(index)}弦</text>`);
    const fret = form.frets[index];
    if (fret === 'x') parts.push(`<text class="dg-mute" x="58" y="${y}">×</text>`);
    else if (fret === 0) parts.push(`<circle class="dg-open" cx="58" cy="${y}" r="7" />`);
    const sound = sounds[index];
    if (sound) parts.push(`<text class="dg-note${sound.degree === 'R' ? ' dg-root' : ''}" x="${nutX + frets * fretW + 26}" y="${y}">${escapeHtml(sound.name)}</text>`);
  }
  for (let k = 0; k < frets; k++) {
    parts.push(`<text class="dg-label" x="${nutX + (k + 0.5) * fretW}" y="${top + 5 * gap + 24}">${start + k}</text>`);
  }
  const barre = form.barre;
  if (barre) {
    const x = xOf(barre.fret);
    const y1 = yOf(6 - barre.to), y2 = yOf(6 - barre.from);
    parts.push(`<rect class="dg-dot" x="${x - 11}" y="${y1 - 11}" width="22" height="${y2 - y1 + 22}" rx="11" />`);
    parts.push(`<text class="dg-finger" x="${x}" y="${(y1 + y2) / 2}">${FINGER_MARK[barre.finger]}</text>`);
  }
  form.frets.forEach((fret, index) => {
    if (fret === 'x' || fret === 0) return;
    const n = stringNo(index);
    if (barre && fret === barre.fret && n <= barre.from && n >= barre.to) return;
    const x = xOf(fret), y = yOf(index);
    parts.push(`<circle class="dg-dot" cx="${x}" cy="${y}" r="11" />`);
    parts.push(`<text class="dg-finger" x="${x}" y="${y}">${FINGER_MARK[form.fingers[index]]}</text>`);
  });
  const label = `${chord.name}コード（${form.name}）の指板図。` + form.frets.map((_, i) => stringDescription(form, i)).join('、') + '。';
  return `<svg class="diagram" viewBox="0 0 380 196" role="img" aria-label="${escapeHtml(label)}">\n            ${parts.join('\n            ')}\n          </svg>`;
}

function renderFormTable(chord, form) {
  const sounds = soundsOf(form.frets, chord.tones, form.id);
  const rows = form.frets.map((fret, index) => {
    const sound = sounds[index];
    const finger = fret === 'x' || fret === 0 ? '—' : FINGER_LABEL[form.fingers[index]];
    const note = sound ? noteText(sound) : '×（ミュート）';
    const degree = sound ? DEGREE_LABEL[sound.degree] : '—';
    return `<tr><td>${stringNo(index)}弦</td><td>${placeOf(fret)}</td><td>${finger}</td><td${sound?.degree === 'R' ? ' class="root"' : ''}>${escapeHtml(note)}</td><td>${degree}</td></tr>`;
  });
  return `<div class="table-wrap">
          <table>
            <thead><tr><th>弦</th><th>押さえる場所</th><th>指</th><th>鳴る音</th><th>度数</th></tr></thead>
            <tbody>
              ${rows.join('\n              ')}
            </tbody>
          </table>
        </div>`;
}

function renderOverview(chord) {
  const rows = chord.forms.map((form, i) => {
    const sounds = soundsOf(form.frets, chord.tones, form.id);
    const lowest = lowestOf(sounds);
    return `<tr><td><a href="#${form.id}">${i + 1}. ${escapeHtml(form.name)}</a></td><td class="num">${soundingStrings(form.frets)}</td><td class="num">${fingersUsed(form)}本</td><td>${stringNo(lowest.index)}弦の ${escapeHtml(noteText(lowest.sound))}</td></tr>`;
  });
  return `<div class="table-wrap">
          <table>
            <thead><tr><th>押さえ方</th><th>鳴らす弦</th><th>使う指</th><th>いちばん低い音</th></tr></thead>
            <tbody>
              ${rows.join('\n              ')}
            </tbody>
          </table>
        </div>`;
}

function renderMuted(chord) {
  const form = chord.forms.find((f) => f.frets.includes('x'));
  if (!form) return '';
  const rows = form.frets.flatMap((fret, index) => {
    if (fret !== 'x') return [];
    const midi = OPEN_MIDI[index];
    const tone = chord.tones.find((t) => pitchClassOf(t.name) === midi % 12);
    const open = OPEN_NOTES[index];
    const verdict = tone ? `構成音（${DEGREE_LABEL[tone.degree]}）。鳴ってもコードは${chord.name}のまま、いちばん低い音が${open.solfege}になる` : `${chord.name}の構成音ではない。鳴ると濁るので止める`;
    return [`<tr><td>${stringNo(index)}弦</td><td>${escapeHtml(`${open.name}（${open.solfege}）`)}</td><td>${verdict}</td></tr>`];
  });
  return `
        <h2>鳴らさない弦を鳴らしてしまったとき</h2>
        <p>「${escapeHtml(form.name)}」で鳴らさない弦を、うっかり開放のまま鳴らしたときに出る音です。</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>弦</th><th>開放で鳴る音</th><th>${chord.name}コードとの関係</th></tr></thead>
            <tbody>
              ${rows.join('\n              ')}
            </tbody>
          </table>
        </div>
`;
}

const OPEN_NOTES = [
  { name: 'E', solfege: 'ミ' }, { name: 'A', solfege: 'ラ' }, { name: 'D', solfege: 'レ' },
  { name: 'G', solfege: 'ソ' }, { name: 'B', solfege: 'シ' }, { name: 'E', solfege: 'ミ' },
];

function renderRelated(chord) {
  const rows = chord.related.map((related) => {
    const base = chord.forms.find((f) => f.id === related.base);
    const [change] = changesOf(base.frets, related.frets);
    const where = `${stringNo(change.index)}弦を${placeOf(change.from)}から${placeOf(change.to)}にする`;
    return `<tr><td class="name">${escapeHtml(related.name)}<span class="reading">${escapeHtml(related.reading)}</span></td><td>${where}</td><td>${escapeHtml(noteText(related.extra))}</td><td>${DEGREE_LABEL[related.extra.degree]}</td></tr>`;
  });
  const baseNames = [...new Set(chord.related.map((r) => chord.forms.find((f) => f.id === r.base).name))];
  return `
        <h2>1か所変えると別のコードになる</h2>
        <p>「${escapeHtml(baseNames.join('」「'))}」から1本の弦だけを変えると、${chord.name}の3つの音に1つ音が加わるか入れ替わり、別の名前のコードになります。</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>コード</th><th>変える場所</th><th>新しく鳴る音</th><th>${chord.name}から見た度数</th></tr></thead>
            <tbody>
              ${rows.join('\n              ')}
            </tbody>
          </table>
        </div>
`;
}

function renderPage(chord) {
  validateChord(chord);
  const url = `${SITE}/fretboard/chords/${chord.slug}/`;
  const others = CHORDS.filter((c) => c.slug !== chord.slug);
  const first = chord.forms[0];
  const firstSounds = soundsOf(first.frets, chord.tones, first.id);
  const toneRows = chord.tones.map((tone) => {
    const semitones = DEGREE_SEMITONES[tone.degree];
    return `<tr><td${tone.degree === 'R' ? ' class="root"' : ''}>${escapeHtml(tone.name)}</td><td>${escapeHtml(tone.solfege)}</td><td>${DEGREE_LABEL[tone.degree]}</td><td class="num">${semitones}</td></tr>`;
  });
  const forms = chord.forms.map((form, i) => `
        <section class="form" id="${form.id}" aria-labelledby="${form.id}-heading">
          <h3 id="${form.id}-heading">${chord.forms.length > 1 ? `${i + 1}. ` : ''}${escapeHtml(form.name)}</h3>
          ${renderDiagram(chord, form)}
          ${renderFormTable(chord, form)}
          ${form.notes.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n          ')}
        </section>`).join('\n');
  const checkSteps = firstSounds.map((sound, index) => (sound ? `${stringNo(index)}弦 ${sound.name}` : `${stringNo(index)}弦 ×`)).join('・');
  const json = (value) => JSON.stringify(value, null, 2).replaceAll('\n', '\n      ');
  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: chord.h1,
    description: chord.description,
    inLanguage: 'ja',
    url,
    mainEntityOfPage: url,
    image: `${SITE}/fretboard/og-image.png`,
    datePublished: chord.published,
    dateModified: chord.published,
    author: { '@type': 'Organization', name: 'Guitar Toolbox', url: `${SITE}/` },
    publisher: { '@type': 'Organization', name: 'Guitar Toolbox', url: `${SITE}/` },
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Guitar Toolbox', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: '指板トレーナー', item: `${SITE}/fretboard/` },
      { '@type': 'ListItem', position: 3, name: `${chord.name}コードの押さえ方`, item: url },
    ],
  };
  return `<!doctype html>
<!-- このファイルは scripts/generate-chord-pages.mjs が生成する。直接編集せず、scripts/chord-pages/chords.mjs を直して再生成する。 -->
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="%BASE_URL%favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="description" content="${escapeHtml(chord.description)}" />
    <meta name="theme-color" content="#0e0f12" />
    <link rel="canonical" href="${url}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Guitar Toolbox" />
    <meta property="og:title" content="${escapeHtml(chord.title)}" />
    <meta property="og:description" content="${escapeHtml(chord.description)}" />
    <meta property="og:image" content="https://guitartoolbox.site%BASE_URL%og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="ja_JP" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">
      ${json(article)}
    </script>
    <script type="application/ld+json">
      ${json(breadcrumbs)}
    </script>
    <style>
      /* 値は docs/design-system/README.md のトークンと同じ。アプリを読み込まない静的ページなので、使う分だけ写す */
      :root {
        color-scheme: dark;
        --bg: #121315;
        --surface: #1f2124;
        --panel: #2a2d31;
        --hair: #34373c;
        --case-edge: #3d4147;
        --ink: #ebe7df;
        --dim: #979aa0;
        --accent: #ffb02e;
      }
      body { margin: 0; background: var(--bg); color: var(--ink); font-family: system-ui, "Hiragino Sans", "Noto Sans JP", Meiryo, sans-serif; font-size: 16px; line-height: 1.8; }
      .guide { max-width: 46rem; margin: 0 auto; padding: 24px 24px 48px; }
      .crumbs { font-size: 12px; color: var(--dim); }
      .crumbs ol { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
      .crumbs li + li::before { content: "›"; margin-right: 8px; }
      .guide a { color: var(--accent); text-underline-offset: 3px; }
      .crumbs a { color: var(--dim); }
      h1 { font-size: 20px; font-weight: 600; line-height: 1.5; margin: 24px 0 16px; }
      h2 { font-size: 16px; font-weight: 600; line-height: 1.5; margin: 32px 0 12px; padding-top: 24px; border-top: 1px solid var(--hair); }
      h3 { font-size: 16px; font-weight: 600; margin: 24px 0 8px; }
      p, li, dd, td { overflow-wrap: anywhere; }
      p { margin: 0 0 16px; }
      ol, ul { margin: 0 0 16px; padding-left: 1.5em; }
      li + li { margin-top: 8px; }
      .chord-switch { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 14px; color: var(--dim); }
      .chord-switch a, .chord-switch span[aria-current] { display: inline-flex; align-items: center; justify-content: center; min-width: 48px; min-height: 48px; border: 1px solid var(--hair); border-radius: 8px; font-weight: 600; text-decoration: none; }
      .chord-switch span[aria-current] { border-color: var(--accent); color: var(--accent); }
      .cta { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 24px 0; }
      .cta a.button { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: 8px; background: var(--accent); color: var(--bg); font-weight: 600; text-decoration: none; }
      .cta span { font-size: 14px; color: var(--dim); }
      .table-wrap { overflow-x: auto; margin: 0 0 16px; border: 1px solid var(--hair); border-radius: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6; }
      th, td { padding: 8px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--hair); }
      thead th { background: var(--surface); color: var(--dim); font-weight: 600; font-size: 12px; white-space: nowrap; }
      tbody tr:last-child td { border-bottom: 0; }
      td.num, td:first-child { white-space: nowrap; font-variant-numeric: tabular-nums; }
      td.name { min-width: 7em; font-weight: 600; }
      td.root { color: var(--accent); font-weight: 600; }
      .reading { display: block; font-size: 12px; font-weight: 400; color: var(--dim); }
      .note { font-size: 14px; color: var(--dim); }
      .form { margin-top: 24px; }
      .diagram { display: block; width: 100%; max-width: 420px; height: auto; margin: 0 0 12px; padding: 8px 0; background: var(--surface); border: 1px solid var(--hair); border-radius: 8px; }
      .diagram text { font-size: 14px; dominant-baseline: central; text-anchor: middle; }
      .diagram .dg-string { stroke: var(--dim); }
      .diagram .dg-fret { stroke: var(--case-edge); stroke-width: 2; }
      .diagram .dg-nut { stroke: var(--ink); stroke-width: 6; }
      .diagram .dg-label { fill: var(--dim); font-size: 14px; }
      .diagram .dg-mute { fill: var(--dim); font-size: 18px; }
      .diagram .dg-open { fill: none; stroke: var(--ink); stroke-width: 2; }
      .diagram .dg-dot { fill: var(--ink); }
      .diagram .dg-finger { fill: var(--bg); font-weight: 600; }
      .diagram .dg-note { fill: var(--ink); font-weight: 600; font-size: 16px; }
      .diagram .dg-note.dg-root { fill: var(--accent); }
      dl { margin: 0; }
      dt { font-weight: 600; margin-top: 16px; }
      dd { margin: 4px 0 0; }
      .next { margin-top: 48px; padding: 16px 24px; background: var(--surface); border: 1px solid var(--hair); border-top-color: var(--case-edge); border-radius: 16px; }
      .next h2 { margin-top: 0; padding-top: 0; border-top: 0; }
      .next ul { margin-bottom: 0; }
      .site-footer { max-width: 46rem; margin: 0 auto; padding: 24px; font-size: 12px; color: var(--dim); border-top: 1px solid var(--hair); }
      .site-footer a { color: var(--dim); }
      @media (max-width: 480px) {
        .guide { padding: 16px 16px 32px; }
        .next { padding: 16px; }
        .site-footer { padding: 16px; }
        th, td { padding: 8px; }
      }
    </style>
    <title>${escapeHtml(chord.title)} — Guitar Toolbox</title>
  </head>
  <body>
    <main class="guide">
      <nav class="crumbs" aria-label="パンくずリスト">
        <ol>
          <li><a href="https://guitartoolbox.site/">Guitar Toolbox</a></li>
          <li><a href="/fretboard/">指板トレーナー</a></li>
          <li aria-current="page">${chord.name}コードの押さえ方</li>
        </ol>
      </nav>
      <article>
        <h1>${escapeHtml(chord.h1)}</h1>
        <nav class="chord-switch" aria-label="コードの押さえ方">
          ${CHORDS.map((c) => (c.slug === chord.slug ? `<span aria-current="page">${c.name}</span>` : `<a href="/fretboard/chords/${c.slug}/">${c.name}</a>`)).join('\n          ')}
        </nav>
        ${chord.lead.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n        ')}
        <p class="note">各弦で鳴る音名と度数は、押さえるフレットから計算しています。指板図は上が1弦、左端がナット（0フレット）で、丸の中の数字は押さえる指（1 人差し指・2 中指・3 薬指・4 小指・親 親指）、右端の文字はその弦で鳴る音です。</p>

        <h2>${chord.name}コードの構成音</h2>
        <p>${chord.name}コード（${chord.name}メジャー）は、${chord.tones.map((t) => `${t.name}（${t.solfege}）`).join('・')}の3つの音でできています。ギターではこの3つを6本の弦に割り振り、同じ音名の音を高さを変えて2回以上鳴らすこともあります。</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>音名</th><th>読み</th><th>度数</th><th>ルートからの半音</th></tr></thead>
            <tbody>
              ${toneRows.join('\n              ')}
            </tbody>
          </table>
        </div>

        <h2>${chord.forms.length > 1 ? `押さえ方は${chord.forms.length}通り` : '押さえ方'}</h2>
        ${renderOverview(chord)}
${forms}
${renderMuted(chord)}
        <h2>1本ずつ鳴らして確かめる</h2>
        <p>コードがきれいに鳴らないときは、弦を1本ずつ弾いて、どの弦の音が出ていないかを探します。</p>
        <ol>
          <li>「${escapeHtml(first.name)}」で押さえます。</li>
          <li>6弦から1弦へ、1本ずつ弾きます。鳴るはずの音は ${escapeHtml(checkSteps)} です（× は音が出ないのが正しい弦）。</li>
          <li>チューナーを使うなら、音名を表示するクロマチックチューナーで、各弦の表示が上の音名と同じかを見ます。</li>
          <li>音が詰まる弦があれば、その弦を押さえている指（表の「指」）を見直します。開放で鳴らす弦が詰まるときは、隣の弦を押さえている指が触れていないかを見ます。</li>
        </ol>
${renderRelated(chord)}
        <h2>指板の上で構成音を探す</h2>
        <p>指板トレーナーの「理論」→「オープン」では、C・D・G など開放弦を使うコードの押さえ方を、音名と度数の表示を切り替えて見られます。押さえる形を覚えたら、どの弦が何の音かを指板の上で確かめると、ほかのコードの形も読みやすくなります。</p>
        <div class="cta">
          <a class="button" href="/fretboard/">指板トレーナーを開く</a>
          <span>無料・ブラウザで使える</span>
        </div>

        <h2>よくある質問</h2>
        <dl>
          ${chord.faq.map((item) => `<dt>${escapeHtml(item.q)}</dt>\n          <dd>${escapeHtml(item.a)}</dd>`).join('\n          ')}
        </dl>
      </article>

      <section class="next" aria-labelledby="next-heading">
        <h2 id="next-heading">次に開くページ</h2>
        <ul>
          ${others.map((c) => `<li><a href="/fretboard/chords/${c.slug}/">${c.name}コードの押さえ方</a></li>`).join('\n          ')}
          <li><a href="/fretboard/guides/memorize-fretboard/">ギター指板の音の覚え方</a>（開放弦から11段階で音名を覚える）</li>
          <li><a href="/fretboard/">指板トレーナーを開く</a></li>
        </ul>
      </section>
    </main>
    <footer class="site-footer">
      <nav aria-label="サイト">
        <a href="https://guitartoolbox.site/">ギター練習ツール一覧</a>
      </nav>
    </footer>
  </body>
</html>
`;
}

/** 生成するページの一覧。path はリポジトリの直下からの相対パス。 */
export function renderChordPages() {
  return CHORDS.map((chord) => ({ slug: chord.slug, path: `chords/${chord.slug}/index.html`, html: renderPage(chord) }));
}

export const CHORD_SLUGS = CHORDS.map((chord) => chord.slug);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const page of renderChordPages()) {
    const file = new URL(`../${page.path}`, import.meta.url);
    mkdirSync(new URL('.', file), { recursive: true });
    writeFileSync(file, page.html);
    console.log(`wrote ${page.path}`);
  }
}
