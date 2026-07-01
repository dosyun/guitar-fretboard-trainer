import { useRegisterSW } from 'virtual:pwa-register/react';

/** 新しい版が出たときに「更新」トーストを出す（autoUpdateの旧版掴み対策）。 */
export function PwaReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3 bg-surface border border-accent rounded-xl px-4 py-3 shadow-lg max-w-md w-full">
        <span className="flex-1 text-sm text-ink">新しい版があります。</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 bg-accent text-bg text-sm font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
        >
          更新
        </button>
        <button onClick={() => setNeedRefresh(false)} className="text-dim text-sm hover:text-ink transition-colors">
          後で
        </button>
      </div>
    </div>
  );
}
