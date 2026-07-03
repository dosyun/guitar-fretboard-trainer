import { describe, it, expect } from 'vitest';
import {
  sameNote,
  getNoteIndex,
  getNoteAt,
  getNoteLabel,
  getNoteNames,
} from './fretboard';

describe('sameNote (異名同音の許容)', () => {
  it('同じピッチクラスの異名同音を同一とみなす', () => {
    expect(sameNote('C#', 'Db')).toBe(true);
    expect(sameNote('Gb', 'F#')).toBe(true);
    expect(sameNote('A#', 'Bb')).toBe(true);
  });

  it('同じ表記は当然同一', () => {
    expect(sameNote('C', 'C')).toBe(true);
    expect(sameNote('F#', 'F#')).toBe(true);
  });

  it('異なるピッチクラスは別物', () => {
    expect(sameNote('C', 'D')).toBe(false);
    expect(sameNote('C#', 'D')).toBe(false);
    expect(sameNote('E', 'F')).toBe(false);
  });

  it('表記「両方」バグ回帰: 判定(sharp)と選択肢(flat)が食い違っても正解できる', () => {
    // getNoteAt(...,'both') は sharp を返し、getNoteNames('both') は flat を返す。
    // 文字列一致だと派生音は絶対に正解できなかった。sameNote なら通る。
    const midiSharp = getNoteAt(1, 4, 'both'); // 5弦4フレット = C#
    const choices = getNoteNames('both'); // flat 表記の選択肢
    const flatChoice = choices.find((n) => sameNote(n, midiSharp));
    expect(flatChoice).toBe('Db');
    expect(sameNote(flatChoice!, midiSharp)).toBe(true);
  });
});

describe('getNoteIndex', () => {
  it('sharp / flat どちらの表記も 0-11 に正規化する', () => {
    expect(getNoteIndex('C')).toBe(0);
    expect(getNoteIndex('C#')).toBe(1);
    expect(getNoteIndex('Db')).toBe(1);
    expect(getNoteIndex('B')).toBe(11);
  });
});

describe('getNoteAt / getNoteLabel', () => {
  it('6弦開放(index0)は E', () => {
    expect(getNoteAt(0, 0, 'sharp')).toBe('E');
  });

  it('flat 指定で flat 表記を返す', () => {
    // 6弦1フレット = F, 6弦2フレット = F#/Gb
    expect(getNoteAt(0, 2, 'flat')).toBe('Gb');
    expect(getNoteAt(0, 2, 'sharp')).toBe('F#');
  });

  it("getNoteLabel の 'both' は併記、getNoteAt の 'both' は sharp キー", () => {
    expect(getNoteLabel(0, 2, 'both')).toBe('F#/Gb');
    expect(getNoteAt(0, 2, 'both')).toBe('F#');
  });
});
