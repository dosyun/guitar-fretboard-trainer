/**
 * フットスイッチ（選択肢）を並べるグリッドの列数を、最長ラベルの表示幅で決める
 * (docs/design-system/README.md「選択肢の列数」)。
 * 表示幅は全角=2・半角=1 で数える。日本語のラベルと英語版の訳語を同じ規則で扱うため。
 *
 * | 最長ラベル        | スマホ | sm 以上 |
 * |-------------------|--------|---------|
 * | 全角4文字以内 (≤8) | 3列    | 4列     |
 * | 全角9文字以内 (≤18)| 2列    | 3列     |
 * | それより長い       | 1列    | 2列     |
 *
 * 列数は選択肢の数を超えない（2択を3列に置いて空きを作らない）。
 */

// Tailwind が拾えるよう、クラス名は完全な文字列で持つ
const BASE_COLS = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'] as const;
const SM_COLS = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4'] as const;

/** 全角=2・半角=1 で数えた表示幅 */
export function labelWidth(label: string): number {
  let width = 0;
  for (const ch of label) {
    // CJK・かな・全角記号（U+1100 以上の主な全角域）を2と数える
    width += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1;
  }
  return width;
}

export function footSwitchGridClass(labels: readonly string[]): string {
  const longest = Math.max(0, ...labels.map(labelWidth));
  const [base, sm] = longest <= 8 ? [3, 4] : longest <= 18 ? [2, 3] : [1, 2];
  const n = Math.max(1, labels.length);
  return `grid ${BASE_COLS[Math.min(base, n)]} ${SM_COLS[Math.min(sm, n)]} gap-2 sm:gap-3 w-full`;
}
