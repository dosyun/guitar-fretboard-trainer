export type CourseEventName =
  | 'course_view'
  | 'course_day_start'
  | 'course_step_complete'
  | 'course_day_complete'
  | 'course_to_looper';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: 'event',
      name: CourseEventName,
      params?: Record<string, string | number | boolean>,
    ) => void;
  }
}

export function track(
  name: CourseEventName,
  params?: Record<string, string | number | boolean>,
): void {
  try {
    if (typeof window === 'undefined') return;
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else {
      window.dataLayer ??= [];
      const queue: NonNullable<Window['gtag']> = function () {
        // eslint-disable-next-line prefer-rest-params -- gtag の標準キューは Arguments を保持する。
        window.dataLayer!.push(arguments);
      };
      queue('event', name, params);
    }
  } catch {
    // 計測の失敗で練習を止めない。
  }
}
