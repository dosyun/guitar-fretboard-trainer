/** 学ぶコースの進捗（完了したレッスンID）を localStorage に保存。 */
const KEY = 'gft-lessons-v1';

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function getCompletedLessons(): Set<string> {
  return new Set(load());
}

export function markLessonComplete(id: string): void {
  const arr = load();
  if (!arr.includes(id)) {
    arr.push(id);
    try {
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch {
      /* ignore */
    }
  }
}
