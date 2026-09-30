export type StudioIconName = 'home' | 'practice' | 'theory' | 'stats' | 'settings';

const PATHS: Record<StudioIconName, string> = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  practice: 'M4 4v16M9 4v16M14 4v16M19 4v16M3 8h17M3 15h17',
  theory: 'M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15',
  stats: 'M4 20V12M10 20V7M16 20V4M3 21h18',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
};

export function StudioIcon({ name, className = 'size-6' }: { name: StudioIconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
