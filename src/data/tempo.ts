/**
 * 回答テンポ設定。
 * - auto（反射モード）: 回答後に自動で次へ（反射練習向け）
 * - manual（学習モード）: 回答後は「次へ」を押すまで待つ（じっくり読む初心者向け）
 */
const KEY = 'gft-tempo-v1';

export function isManualTempo(): boolean {
  try {
    return localStorage.getItem(KEY) === 'manual';
  } catch {
    return false;
  }
}

export function setManualTempo(manual: boolean): void {
  try {
    localStorage.setItem(KEY, manual ? 'manual' : 'auto');
  } catch {
    /* ignore */
  }
}
