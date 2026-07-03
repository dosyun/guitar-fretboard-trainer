import { describe, it, expect, beforeEach } from 'vitest';
import { exportBackup, importBackup } from './backup';

class MemStorage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemStorage }).localStorage = new MemStorage();
});

describe('backup export/import', () => {
  it('アプリのキーだけを書き出す（無関係キーは含めない）', () => {
    localStorage.setItem('gft-sessions-v1', '[1,2]');
    localStorage.setItem('guitar-fret-best-streak', '7');
    localStorage.setItem('unrelated-key', 'x');

    const b = exportBackup(123);
    expect(b.app).toBe('guitar-flet');
    expect(b.exportedAt).toBe(123);
    expect(b.data['gft-sessions-v1']).toBe('[1,2]');
    expect(b.data['guitar-fret-best-streak']).toBe('7');
    expect(b.data['unrelated-key']).toBeUndefined();
  });

  it('書き出し→消去→読み込みで復元できる', () => {
    localStorage.setItem('gft-cellstats-v1', '{"a":1}');
    const b = exportBackup(1);
    localStorage.removeItem('gft-cellstats-v1');
    expect(localStorage.getItem('gft-cellstats-v1')).toBeNull();

    const res = importBackup(b);
    expect(res.ok).toBe(true);
    expect(localStorage.getItem('gft-cellstats-v1')).toBe('{"a":1}');
  });

  it('他アプリ/壊れたファイルは拒否する', () => {
    expect(importBackup(null).ok).toBe(false);
    expect(importBackup({ app: 'other', data: {} }).ok).toBe(false);
    expect(importBackup({ app: 'guitar-flet' }).ok).toBe(false);
  });
});
