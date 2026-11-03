export type CourseEntry = 'direct' | 'home_card' | 'lesson' | 'hub';

export function parseCourseDay(search: string): number | undefined {
  const value = new URLSearchParams(search).get('day');
  return value !== null && /^[1-5]$/.test(value) ? Number(value) : undefined;
}

export function courseEntry(search: string, referrer: string): CourseEntry {
  const from = new URLSearchParams(search).get('from');
  if (from === 'direct' || from === 'home_card' || from === 'lesson' || from === 'hub') return from;
  try {
    const url = new URL(referrer);
    if (url.origin === 'https://guitartoolbox.site'
      && (url.pathname === '/' || url.pathname.startsWith('/theory/'))) return 'hub';
  } catch {
    // 空のリファラーは直接流入として扱う。
  }
  return 'direct';
}

export function readCourseRoute(pathname: string, search: string, referrer: string) {
  return /\/course\/?$/.test(pathname)
    ? { day: parseCourseDay(search), entry: courseEntry(search, referrer) } : undefined;
}

export function courseLocation(home: string, day: number | undefined, search: string, hash: string): string {
  const params = new URLSearchParams(search);
  if (day !== undefined && Number.isInteger(day) && day >= 1 && day <= 5) params.set('day', String(day));
  else params.delete('day');
  const query = params.toString();
  return home + 'course/' + (query ? '?' + query : '') + hash;
}
