import { describe, it, expect } from 'vitest';
import { getScaleBoxPositions } from './scales';
import type { ScaleBox } from './scales';

// 記事（guitar-theory の pentatonic-positions）の図と同じ書き方: 弦は 6=6弦（低いE）〜1=1弦。
// アプリの string は 0=6弦 なので、string = 6 - 弦番号 に直して比べる。
type Mark = [stringNo: number, fret: number, degree: string];

function marksOf(box: ScaleBox): Mark[] {
  return box.positions
    .map(({ pos, degree }): Mark => [6 - pos.string, pos.fret, degree])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
}

function sorted(marks: Mark[]): Mark[] {
  return [...marks].sort((a, b) => b[0] - a[0] || a[1] - b[1]);
}

// Aマイナーペンタの標準の5ポジション（12フレット上の位置）
const A_MINOR: Mark[][] = [
  [[6, 5, 'R'], [6, 8, 'm3'], [5, 5, '4'], [5, 7, '5'], [4, 5, 'm7'], [4, 7, 'R'],
    [3, 5, 'm3'], [3, 7, '4'], [2, 5, '5'], [2, 8, 'm7'], [1, 5, 'R'], [1, 8, 'm3']],
  [[6, 8, 'm3'], [6, 10, '4'], [5, 7, '5'], [5, 10, 'm7'], [4, 7, 'R'], [4, 10, 'm3'],
    [3, 7, '4'], [3, 9, '5'], [2, 8, 'm7'], [2, 10, 'R'], [1, 8, 'm3'], [1, 10, '4']],
  [[6, 10, '4'], [6, 12, '5'], [5, 10, 'm7'], [5, 12, 'R'], [4, 10, 'm3'], [4, 12, '4'],
    [3, 9, '5'], [3, 12, 'm7'], [2, 10, 'R'], [2, 13, 'm3'], [1, 10, '4'], [1, 12, '5']],
  [[6, 12, '5'], [6, 15, 'm7'], [5, 12, 'R'], [5, 15, 'm3'], [4, 12, '4'], [4, 14, '5'],
    [3, 12, 'm7'], [3, 14, 'R'], [2, 13, 'm3'], [2, 15, '4'], [1, 12, '5'], [1, 15, 'm7']],
  [[6, 15, 'm7'], [6, 17, 'R'], [5, 15, 'm3'], [5, 17, '4'], [4, 14, '5'], [4, 17, 'm7'],
    [3, 14, 'R'], [3, 17, 'm3'], [2, 15, '4'], [2, 17, '5'], [1, 15, 'm7'], [1, 17, 'R']],
];

const shift = (marks: Mark[], by: number): Mark[] => marks.map(([s, f, d]) => [s, f + by, d]);

describe('getScaleBoxPositions: ペンタの標準5ポジション', () => {
  it('Aマイナーペンタ（22フレット）は記事の第1〜第5と同じ音', () => {
    const boxes = getScaleBoxPositions('minor-pentatonic', 'A', 22);
    expect(boxes).toHaveLength(5);
    boxes.forEach((box, i) => expect(marksOf(box)).toEqual(sorted(A_MINOR[i])));
    expect(boxes.map((b) => b.fretRange)).toEqual([[5, 8], [7, 10], [9, 13], [12, 15], [14, 17]]);
  });

  it('各箱は各弦2音ずつ、12音', () => {
    for (const box of getScaleBoxPositions('minor-pentatonic', 'A', 22)) {
      expect(box.positions).toHaveLength(12);
      for (let s = 0; s < 6; s++) {
        expect(box.positions.filter((p) => p.pos.string === s)).toHaveLength(2);
      }
    }
  });

  it('第1は8フレットの♭3と♭7を含む（旧実装は4〜7フレットで外れていた）', () => {
    const [first] = getScaleBoxPositions('minor-pentatonic', 'A', 12);
    expect(marksOf(first)).toContainEqual([6, 8, 'm3']);
    expect(marksOf(first)).toContainEqual([2, 8, 'm7']);
    expect(marksOf(first)).toContainEqual([1, 8, 'm3']);
  });

  it('12フレットまでの表示では、第4と第5を12フレット下（0〜3、2〜5）に置く', () => {
    const boxes = getScaleBoxPositions('minor-pentatonic', 'A', 12);
    expect(marksOf(boxes[3])).toEqual(sorted(shift(A_MINOR[3], -12)));
    expect(marksOf(boxes[4])).toEqual(sorted(shift(A_MINOR[4], -12)));
    expect(boxes[3].fretRange).toEqual([0, 3]);
    expect(boxes[4].fretRange).toEqual([2, 5]);
    // 第3は2弦13フレットだけ画面外。残り11音を元の位置で出す
    expect(marksOf(boxes[2])).toEqual(sorted(A_MINOR[2].filter(([, f]) => f <= 12)));
  });

  it('キーを変えると6弦のルートが第1の左端になる（Gマイナーは3〜6フレット）', () => {
    const boxes = getScaleBoxPositions('minor-pentatonic', 'G', 22);
    boxes.forEach((box, i) => expect(marksOf(box)).toEqual(sorted(shift(A_MINOR[i], -2))));
    expect(boxes[0].fretRange).toEqual([3, 6]);
  });

  it('Eマイナーは開放の箱が第1', () => {
    const [first] = getScaleBoxPositions('minor-pentatonic', 'E', 12);
    expect(marksOf(first)).toEqual(sorted(shift(A_MINOR[0], -5)));
    expect(first.fretRange).toEqual([0, 3]);
  });

  it('メジャーペンタは同じ5音のマイナーペンタと同じ箱・同じ番号（Cメジャーの第1＝Aマイナーの第1）', () => {
    const toMajor: Record<string, string> = { R: '6', m3: 'R', '4': '2', '5': '3', m7: '5' };
    const boxes = getScaleBoxPositions('major-pentatonic', 'C', 22);
    boxes.forEach((box, i) => {
      expect(marksOf(box)).toEqual(sorted(A_MINOR[i].map(([s, f, d]): Mark => [s, f, toMajor[d]])));
    });
    expect(boxes[0].fretRange).toEqual([5, 8]);
  });

  it('ブルースはマイナーペンタの箱に、箱の範囲内の♭5を足す', () => {
    const boxes = getScaleBoxPositions('blues', 'A', 22);
    expect(marksOf(boxes[0])).toEqual(sorted([...A_MINOR[0], [5, 6, '♭5'], [3, 8, '♭5']]));
    expect(boxes[0].fretRange).toEqual([5, 8]);
    for (let i = 0; i < 5; i++) {
      const withoutFlat5 = marksOf(boxes[i]).filter(([, , d]) => d !== '♭5');
      expect(withoutFlat5).toEqual(sorted(A_MINOR[i]));
    }
  });
});

describe('getScaleBoxPositions: 7音スケール（フレット幅の区切り、従来どおり）', () => {
  it('Aメジャーは6弦ルートの1フレット手前から4フレット幅', () => {
    const boxes = getScaleBoxPositions('major', 'A', 22);
    expect(boxes.map((b) => b.fretRange)).toEqual([[4, 8], [8, 12], [12, 16], [16, 20], [20, 22]]);
  });
});
