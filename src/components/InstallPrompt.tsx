import { useEffect, useState } from 'react';

// beforeinstallprompt は標準型に無いので最小定義
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'gft-install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * アプリ追加の導線。
 * - Android/Chrome: beforeinstallprompt を捕まえてワンタップ「追加」
 * - iOS: 自動プロンプトが無いので「共有→ホーム画面に追加」を案内
 * すでにスタンドアロン起動なら何も出さない。
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalone()) return;
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    if (isIOS()) setIosHint(true);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  if (dismissed || isStandalone()) return null;
  if (!deferred && !iosHint) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <div className="bg-accent-soft border border-accent rounded-xl px-4 py-3 flex items-start gap-3">
      <span className="inline-block size-1.5 rounded-full bg-accent mt-1.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        {deferred ? (
          <>
            <p className="text-ink">ホーム画面に追加してアプリとして使えます。</p>
            <button
              onClick={install}
              className="mt-2 px-4 py-1.5 bg-accent text-bg font-semibold rounded-lg text-sm hover:opacity-90 active:opacity-80 transition-opacity"
            >
              アプリとして追加
            </button>
          </>
        ) : (
          <p className="text-ink text-pretty">
            Safariの共有ボタン <span className="font-mono">□↑</span> →「<span className="text-accent">ホーム画面に追加</span>」でアプリになります。
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="閉じる"
        className="text-dim hover:text-ink text-lg leading-none shrink-0"
      >
        ×
      </button>
    </div>
  );
}
