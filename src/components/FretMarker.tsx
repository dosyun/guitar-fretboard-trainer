import { NOTE_COLORS } from '../data/fretboard';
import { MARKER } from '../data/boardPalette';
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
  let textColor: string = MARKER.labelText;

  const color = noteColor ? NOTE_COLORS[noteColor] : null;

  if (highlighted && feedback === 'correct') {
    fill = MARKER.correctBg;
    stroke = MARKER.correctBorder;
    textColor = MARKER.correctText;
  } else if (highlighted && feedback === 'wrong') {
    fill = MARKER.wrongBg;
    stroke = MARKER.wrongBorder;
    textColor = MARKER.wrongText;
  } else if (highlighted && color) {
    fill = color.bg;
    stroke = color.border;
    textColor = color.text;
  } else if (highlighted) {
    fill = MARKER.highlightBg;
    stroke = MARKER.highlightBorder;
    textColor = MARKER.highlightText;
  } else if (showLabel && color) {
    fill = color.bg;
    stroke = color.border;
    textColor = color.text;
  } else if (showLabel) {
    fill = MARKER.labelBg;
    stroke = MARKER.labelBorder;
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
