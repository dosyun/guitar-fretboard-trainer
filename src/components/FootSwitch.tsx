import type { ReactNode } from 'react';

export type Lamp = 'off' | 'correct' | 'wrong';

interface FootSwitchProps {
  label: ReactNode;
  /** 下の状態ランプ。正誤が出たときだけ点灯させる */
  lamp?: Lamp;
  /** 回答後、正誤に関係ないスイッチの文字を下げる */
  dimmed?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  onClick: () => void;
}

/**
 * 回答の選択肢 = エフェクターの踏みスイッチ (docs/design-system/README.md「選択肢」)。
 * 押した結果はスイッチ下の状態ランプと枠線の色で示す。影は使わない。
 */
export function FootSwitch({ label, lamp = 'off', dimmed = false, disabled, ariaLabel, onClick }: FootSwitchProps) {
  const long = typeof label === 'string' && label.length > 3;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`min-h-14 min-w-14 flex flex-col items-center justify-center gap-2 rounded-lg border bg-panel px-2 py-2 hover:border-dim active:bg-glass disabled:cursor-default ${
        lamp === 'correct' ? 'border-correct' : lamp === 'wrong' ? 'border-wrong' : 'border-hair'
      }`}
    >
      <span className={`text-center font-mono font-semibold ${long ? 'text-sm' : 'text-xl'} ${dimmed ? 'text-dim' : 'text-ink'}`}>{label}</span>
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${lamp === 'correct' ? 'bg-correct' : lamp === 'wrong' ? 'bg-wrong' : 'bg-glass'}`}
      />
    </button>
  );
}
