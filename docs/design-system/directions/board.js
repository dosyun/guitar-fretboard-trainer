// 3案のラフで共通に使う指板の描画。サイトのコードとは無関係（ラフ専用）。
// drawBoard(el, { orient: 'h'|'v', frets, c: {wood,fret,nut,string,inlay,mark,markText,label}, target:{s,f}, label, heat })
// s: 0=1弦(高E) … 5=6弦(低E)。heat: [[s,f,色],…] でセルを塗る。
function drawBoard(el, o) {
  const F = o.frets || 12, S = 6, c = o.c;
  const H = o.orient !== 'v';
  const len = o.len || 1000;
  const L = H ? len : 300, W = H ? 300 : len; // 長辺=フレット方向
  const pad = 26, nut = 10;
  const fw = (H ? L : W) - pad * 2 - nut; // 指板の長さ
  const sw = (H ? W : L) - pad * 2;       // 弦の幅
  const fx = f => pad + nut + (fw * f) / F;               // f番フレット線の位置
  const sy = s => pad + (sw * ((H ? s : S - 1 - s) + 0.5)) / S; // 弦の位置（縦置きはコード図と同じく6弦が左）
  const pt = (along, across) => (H ? [along, across] : [across, along]);
  const parts = [];
  const rect = (a0, b0, a1, b1, fill, rx = 0) => {
    const [x0, y0] = pt(a0, b0), [x1, y1] = pt(a1, b1);
    parts.push(`<rect x="${Math.min(x0, x1)}" y="${Math.min(y0, y1)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1 - y0)}" rx="${rx}" fill="${fill}"/>`);
  };
  const line = (a0, b0, a1, b1, stroke, w) => {
    const [x0, y0] = pt(a0, b0), [x1, y1] = pt(a1, b1);
    parts.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${stroke}" stroke-width="${w}"/>`);
  };
  const circ = (a, b, r, fill, extra = '') => {
    const [x, y] = pt(a, b);
    parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`);
  };
  const text = (a, b, t, fill, size, weight = 600) => {
    const [x, y] = pt(a, b);
    parts.push(`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="middle" dominant-baseline="central" font-family="'DM Mono',ui-monospace,monospace">${t}</text>`);
  };
  if (c.wood) rect(pad + nut, pad, pad + nut + fw, pad + sw, c.wood);
  if (o.heat) o.heat.forEach(([s, f, col]) => rect(fx(f - 1) + 1, sy(s) - sw / S / 2 + 1, fx(f) - 1, sy(s) + sw / S / 2 - 1, col, 3));
  const mid = pad + sw / 2;
  [3, 5, 7, 9].forEach(f => f <= F && circ((fx(f - 1) + fx(f)) / 2, mid, 7, c.inlay));
  if (F >= 12) { circ((fx(11) + fx(12)) / 2, sy(1) + sw / S / 2, 7, c.inlay); circ((fx(11) + fx(12)) / 2, sy(3) + sw / S / 2, 7, c.inlay); }
  rect(pad, pad - 2, pad + nut, pad + sw + 2, c.nut);
  for (let f = 1; f <= F; f++) line(fx(f), pad, fx(f), pad + sw, c.fret, 3);
  for (let s = 0; s < S; s++) line(pad, sy(s), pad + nut + fw, sy(s), c.string, 1 + s * 0.45);
  if (c.label) for (let f = 1; f <= F; f++) if ([3, 5, 7, 9, 12].includes(f)) text((fx(f - 1) + fx(f)) / 2, pad + sw + 15, f, c.label, 13, 500);
  if (o.target) {
    const a = (fx(o.target.f - 1) + fx(o.target.f)) / 2, b = sy(o.target.s);
    if (c.ring) circ(a, b, 27, 'none', `stroke="${c.ring}" stroke-width="3"`);
    circ(a, b, 19, c.mark);
    text(a, b, o.label || '?', c.markText, 20, 700);
  }
  const vb = H ? `0 0 ${L} ${W}` : `0 0 ${L} ${W}`;
  el.innerHTML = `<svg viewBox="${vb}" width="100%" style="display:block">${parts.join('')}</svg>`;
}
