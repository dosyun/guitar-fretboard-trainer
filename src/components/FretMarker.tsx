import { NOTE_COLORS } from '../data/fretboard';
import type { Feedback } from '../types';

interface FretMarkerProps {
  cx: number;
  cy: number;
  highlighted: boolean;
  feedback: Feedback;
  showLabel?: string;
  noteColor?: string; // 音名を渡すと色分け表示
  onClick?: () => void;
}

export function FretMarker({
  cx,
  cy,
  highlighted,
  feedback,
  showLabel,
  noteColor,
  onClick,
}: FretMarkerProps) {
  let fill = 'transparent';
  let stroke = 'transparent';
  let textColor = '#374151';

  const color = noteColor ? NOTE_COLORS[noteColor] : null;

  if (highlighted && feedback === 'correct') {
    fill = '#22c55e';
    stroke = '#16a34a';
    textColor = '#fff';
  } else if (highlighted && feedback === 'wrong') {
    fill = '#ef4444';
    stroke = '#dc2626';
    textColor = '#fff';
  } else if (highlighted && color) {
    fill = color.bg;
    stroke = color.border;
    textColor = color.text;
  } else if (highlighted) {
    fill = '#3b82f6';
    stroke = '#2563eb';
    textColor = '#fff';
  } else if (showLabel && color) {
    fill = color.bg;
    stroke = color.border;
    textColor = color.text;
  } else if (showLabel) {
    fill = '#e5e7eb';
    stroke = '#d1d5db';
  }

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      {/* 透明な大きめ円でタッチ領域を確保 */}
      {onClick && (
        <circle
          cx={cx}
          cy={cy}
          r={18}
          fill="transparent"
          stroke="none"
        />
      )}
      {showLabel && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={600}
          fill={textColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {showLabel}
        </text>
      )}
    </g>
  );
}
