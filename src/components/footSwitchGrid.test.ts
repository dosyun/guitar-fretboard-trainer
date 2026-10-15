import { describe, expect, it } from 'vitest';
import { footSwitchGridClass, labelWidth } from './footSwitchGrid';

describe('footSwitchGridClass', () => {
  it('counts full-width characters as 2 and half-width as 1', () => {
    expect(labelWidth('C#')).toBe(2);
    expect(labelWidth('長3度')).toBe(5);
    expect(labelWidth('メジャー（明るい）')).toBe(18);
  });

  it('chooses columns from the longest label and never exceeds the choice count', () => {
    expect(footSwitchGridClass(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])).toContain('grid-cols-3 sm:grid-cols-4');
    expect(footSwitchGridClass(['トニック', 'サブドミナント', 'ドミナント'])).toContain('grid-cols-2 sm:grid-cols-3');
    expect(footSwitchGridClass(['長3度（明るい）', '短3度（暗い）'])).toContain('grid-cols-2 sm:grid-cols-2');
    expect(footSwitchGridClass(['2本細い弦・2フレット上', '1本細い弦・同フレット', '同じ弦・5フレット上'])).toContain('grid-cols-1 sm:grid-cols-2');
  });
});
