export const COURSE_STORAGE_KEY = 'gft-course-v1';
export const BPM_STEPS = [60, 72, 84] as const;
export type CourseBpm = (typeof BPM_STEPS)[number];

export interface CourseDayProgress {
  startedAt: number;
  completedAt?: number;
  lastCompletedAt?: number;
  hidden?: { correct: number; total: number };
  switchBpm?: CourseBpm;
  switchOk?: boolean;
  stalls?: string[];
  looperClicked?: boolean;
}

export interface CourseStore {
  version: 1;
  days: Record<number, CourseDayProgress>;
}

const emptyStore = (): CourseStore => ({ version: 1, days: {} });
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function isProgress(value: unknown): value is CourseDayProgress {
  if (!isObject(value) || !isFiniteNumber(value.startedAt)) return false;
  if (value.completedAt !== undefined && !isFiniteNumber(value.completedAt)) return false;
  if (value.lastCompletedAt !== undefined && !isFiniteNumber(value.lastCompletedAt)) return false;
  if (value.hidden !== undefined) {
    const hidden = value.hidden;
    if (!isObject(hidden) || !Number.isInteger(hidden.correct) || !Number.isInteger(hidden.total)
      || !isFiniteNumber(hidden.correct) || !isFiniteNumber(hidden.total)
      || hidden.correct < 0 || hidden.total < hidden.correct) return false;
  }
  if (value.switchBpm !== undefined && value.switchBpm !== 60
    && value.switchBpm !== 72 && value.switchBpm !== 84) return false;
  if (value.switchOk !== undefined && typeof value.switchOk !== 'boolean') return false;
  if (value.looperClicked !== undefined && typeof value.looperClicked !== 'boolean') return false;
  return value.stalls === undefined
    || (Array.isArray(value.stalls) && value.stalls.every((stall) => typeof stall === 'string'));
}

function isCourseStore(value: unknown): value is CourseStore {
  return isObject(value) && value.version === 1 && isObject(value.days)
    && Object.entries(value.days).every(([day, progress]) => /^[1-5]$/.test(day) && isProgress(progress));
}

export function loadCourse(): CourseStore {
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEY);
    if (raw === null) return emptyStore();
    const value: unknown = JSON.parse(raw);
    return isCourseStore(value) ? value : emptyStore();
  } catch {
    return emptyStore();
  }
}

export function saveCourse(store: CourseStore): void {
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(isCourseStore(store) ? store : emptyStore()));
  } catch {
    // 保存できなくても練習は続ける。
  }
}

export function updateDay(
  day: number,
  patch: Partial<CourseDayProgress>,
  now = Date.now(),
): CourseStore {
  if (!Number.isInteger(day) || day < 1 || day > 5) throw new RangeError('Invalid course day');
  const store = loadCourse();
  const existing = store.days[day];
  store.days[day] = { ...existing, ...patch, startedAt: existing?.startedAt ?? now };
  saveCourse(store);
  return store;
}

export function startDay(day: number, now = Date.now()): CourseStore {
  return updateDay(day, {}, now);
}

export function completeDay(day: number, now = Date.now()): CourseStore {
  const completedAt = loadCourse().days[day]?.completedAt;
  return updateDay(day, completedAt === undefined
    ? { completedAt: now }
    : { completedAt, lastCompletedAt: now }, now);
}

export function getNextDay(store = loadCourse()): number {
  for (let day = 1; day <= 5; day++) {
    if (store.days[day]?.completedAt === undefined) return day;
  }
  return 1;
}

export type GapBucket = 'same_day' | '1-7d' | '8d+' | 'none';

export function gapBucket(prevCompletedAt: number | undefined, now: number): GapBucket {
  if (prevCompletedAt === undefined) return 'none';
  const midnight = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };
  const days = Math.round((midnight(now) - midnight(prevCompletedAt)) / 86_400_000);
  return days <= 0 ? 'same_day' : days <= 7 ? '1-7d' : '8d+';
}

export function gapForDay(day: number, store: CourseStore, now: number): GapBucket {
  return gapBucket(day === 1 ? undefined : store.days[day - 1]?.completedAt, now);
}

export function nextBpm(store: CourseStore, day: number): CourseBpm {
  for (let earlier = day - 1; earlier >= 1; earlier--) {
    const progress = store.days[earlier];
    if (progress?.switchBpm === undefined) continue;
    const index = BPM_STEPS.indexOf(progress.switchBpm);
    return BPM_STEPS[Math.min(index + (progress.switchOk === true ? 1 : 0), BPM_STEPS.length - 1)];
  }
  return 60;
}
