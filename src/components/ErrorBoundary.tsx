import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * ルート ErrorBoundary。子のレンダー例外を捕まえて白画面化を防ぎ、
 * 「再読み込み」で復帰できるようにする（オフラインPWA中でも詰まない）。
 * 練習記録は localStorage なので、リロードしても失われない。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 開発時に原因を追えるようにログは残す（外部送信はしない）。
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 bg-bg text-ink">
        <div className="max-w-sm w-full bg-surface border border-hair rounded-2xl p-6 space-y-4 text-center">
          <div className="font-mono text-xs tracking-widest text-accent flex items-center justify-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
            ERROR
          </div>
          <p className="text-ink font-medium text-balance">問題が発生しました</p>
          <p className="text-dim text-sm text-pretty">
            画面の描画でエラーが起きました。練習記録は端末に保存されているので、再読み込みで元に戻ります。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }
}
