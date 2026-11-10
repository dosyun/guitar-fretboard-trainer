/**
 * 出題の選び方の共通部品。
 *
 * 直前と同じ問題が続くと、正解しても画面が変わらず「次へ進まない」ように見え、
 * 同じ答えを押し直すと正答数が増え、待ち時間が反応時間に混ざる（2026-11-10 外部レビューの指摘）。
 * そのため、候補が2つ以上ある限り直前と同じ問題は出さない。
 */

/**
 * 直近の問題を避けて1問選ぶ。
 *
 * 1. 直近の問題すべて（recent）を避けるよう generate に伝え、最大 tries 回引き直す。
 * 2. それでも直近と重なるなら、少なくとも直前の1問（recent の末尾）とは違う問題になるまで引き直す。
 * 候補が1つしかない場合は同じ問題を返す（避けようがない）。
 */
export function pickFresh<T>(
  generate: (avoid: ReadonlySet<string>) => T,
  keyOf: (question: T) => string,
  recent: readonly string[],
  tries = 6,
): T {
  const avoidRecent = new Set(recent);
  let question = generate(avoidRecent);
  for (let i = 0; i < tries && avoidRecent.has(keyOf(question)); i++) {
    question = generate(avoidRecent);
  }
  const last = recent.at(-1);
  if (last === undefined || keyOf(question) !== last) return question;
  const avoidLast = new Set([last]);
  for (let i = 0; i < 30 && keyOf(question) === last; i++) {
    question = generate(avoidLast);
  }
  return question;
}

/** 配列から1つ選ぶ。候補が2つ以上あるときは previous と違うものを返す。 */
export function pickOtherThan<T>(items: readonly T[], previous: T | null | undefined, same: (a: T, b: T) => boolean = Object.is): T {
  const others = previous == null ? items : items.filter((item) => !same(item, previous));
  const pool = others.length > 0 ? others : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 「音名→位置」で同じ音が続けて出るとき（1音だけのドリルなど）に、答え済みの場所を覚えておく。
 * 同じ場所を押し直すだけで正答数が増えないよう、答え済みの場所は数えない。
 */
export interface FoundCells {
  note: string | null;
  cells: string[];
}

export const EMPTY_FOUND: FoundCells = { note: null, cells: [] };

export const cellKey = (string: number, fret: number) => `${string}:${fret}`;

/** 次の問題の音が変わったら、答え済みの場所を忘れる。 */
export function foundForQuestion(found: FoundCells, note: string | null): FoundCells {
  if (note === null) return EMPTY_FOUND;
  return found.note === note ? found : { note, cells: [] };
}

/** この問題で、すでに答えた場所を押したか。 */
export function isFoundAgain(found: FoundCells, note: string | null, cell: string): boolean {
  return note !== null && found.note === note && found.cells.includes(cell);
}

/** 正解した場所を足す。練習範囲内のその音の場所（targetCells）をすべて答えたら、最初から数え直す。 */
export function addFound(found: FoundCells, note: string, cell: string, targetCells: readonly string[]): FoundCells {
  const cells = found.note === note ? [...found.cells, cell] : [cell];
  const complete = targetCells.every((target) => cells.includes(target));
  return { note, cells: complete ? [] : cells };
}
