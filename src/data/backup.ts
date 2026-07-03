/**
 * 練習データのバックアップ（書き出し / 読み込み）。
 * 全記録が localStorage のみだと機種変更・データ削除で失われるため、
 * JSON でまるごと退避・復元できるようにする。外部送信は一切しない。
 */
const LEGACY_KEYS = ['guitar-fret-best-streak'];

function isAppKey(k: string): boolean {
  return k.startsWith('gft-') || LEGACY_KEYS.includes(k);
}

export interface BackupFile {
  app: 'guitar-flet';
  version: 1;
  exportedAt: number;
  data: Record<string, string>; // localStorage key -> 生の値
}

/** 現在の全練習データを1オブジェクトに集約する。 */
export function exportBackup(now: number): BackupFile {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !isAppKey(k)) continue;
      const v = localStorage.getItem(k);
      if (v != null) data[k] = v;
    }
  } catch {
    /* localStorage 不可 — 空で返す */
  }
  return { app: 'guitar-flet', version: 1, exportedAt: now, data };
}

/** バックアップJSONを検証して localStorage へ復元する。呼び出し側でリロードする想定。 */
export function importBackup(json: unknown): { ok: boolean; error?: string } {
  if (!json || typeof json !== 'object') {
    return { ok: false, error: 'ファイルの形式が正しくありません。' };
  }
  const f = json as Partial<BackupFile>;
  if (f.app !== 'guitar-flet' || !f.data || typeof f.data !== 'object') {
    return { ok: false, error: 'このアプリのバックアップファイルではありません。' };
  }
  try {
    for (const [k, v] of Object.entries(f.data)) {
      if (isAppKey(k) && typeof v === 'string') localStorage.setItem(k, v);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: '保存に失敗しました（ストレージ制限の可能性）。' };
  }
}
