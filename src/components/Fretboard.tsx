import { FretMarker } from './FretMarker';
import { getOpenStringName, getNoteAt } from '../data/fretboard';
import type { FretPosition, Feedback, Accidental } from '../types';

interface FretboardProps {
  maxFret: number;
  accidental: Accidental;
  highlightPosition: FretPosition | null;
  feedback: Feedback;
  correctPositions?: FretPosition[];
  showLabelAt?: (stringIndex: number, fret: number) => string | undefined;
  onPositionClick?: (pos: FretPosition) => void;
}

// レイアウト定数
const PADDING_LEFT = 40;
const PADDING_RIGHT = 15;
const PADDING_TOP = 25;
const PADDING_BOTTOM = 15;
const STRING_SPACING = 24;
const FRET_WIDTH = 55;
const NUT_WIDTH = 4;

// ポジションマーク (3,5,7,9,12)
const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

export function Fretboard({
  maxFret,
  accidental,
  highlightPosition,
  feedback,
  correctPositions,
  showLabelAt,
  onPositionClick,
}: FretboardProps) {
  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + PADDING_BOTTOM;

  const fretX = (fret: number) =>
    PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * fret;

  const stringY = (stringIndex: number) =>
    PADDING_TOP + STRING_SPACING * (5 - stringIndex);

  const posX = (fret: number) =>
    fret === 0
      ? PADDING_LEFT - 14
      : fretX(fret) - FRET_WIDTH / 2;

  const isHighlighted = (s: number, f: number) =>
    highlightPosition?.string === s && highlightPosition?.fret === f;

  const isCorrectPos = (s: number, f: number) =>
    correctPositions?.some((p) => p.string === s && p.fret === f) ?? false;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full"
      style={{ touchAction: 'manipulation', minWidth: `${maxFret * 50}px` }}
    >
      {/* 背景 */}
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH + FRET_WIDTH * maxFret}
        height={STRING_SPACING * 5 + STRING_SPACING}
        rx={2}
        fill="#fef3c7"
      />

      {/* ナット */}
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH}
        height={STRING_SPACING * 5 + STRING_SPACING}
        fill="#78716c"
        rx={1}
      />

      {/* フレット線 */}
      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <line
          key={`fret-${f}`}
          x1={fretX(f)}
          y1={PADDING_TOP - STRING_SPACING / 2}
          x2={fretX(f)}
          y2={PADDING_TOP + STRING_SPACING * 5 + STRING_SPACING / 2}
          stroke="#a8a29e"
          strokeWidth={1.5}
        />
      ))}

      {/* ポジションマーク (ドット) */}
      {SINGLE_DOTS.filter((f) => f <= maxFret).map((f) => (
        <circle
          key={`dot-${f}`}
          cx={fretX(f) - FRET_WIDTH / 2}
          cy={PADDING_TOP + STRING_SPACING * 2.5}
          r={5}
          fill="#d6d3d1"
        />
      ))}
      {DOUBLE_DOT <= maxFret && (
        <>
          <circle
            cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
            cy={PADDING_TOP + STRING_SPACING * 1.5}
            r={5}
            fill="#d6d3d1"
          />
          <circle
            cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
            cy={PADDING_TOP + STRING_SPACING * 3.5}
            r={5}
            fill="#d6d3d1"
          />
        </>
      )}

      {/* フレット番号 */}
      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <text
          key={`fn-${f}`}
          x={fretX(f) - FRET_WIDTH / 2}
          y={PADDING_TOP - STRING_SPACING / 2 - 6}
          textAnchor="middle"
          fontSize={9}
          fill="#9ca3af"
        >
          {f}
        </text>
      ))}

      {/* 弦 */}
      {Array.from({ length: 6 }, (_, s) => {
        const thickness = 1 + s * 0.3;
        return (
          <line
            key={`string-${s}`}
            x1={PADDING_LEFT}
            y1={stringY(s)}
            x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret}
            y2={stringY(s)}
            stroke="#78716c"
            strokeWidth={thickness}
          />
        );
      })}

      {/* 弦名ラベル (ナット左側) */}
      {Array.from({ length: 6 }, (_, s) => (
        <text
          key={`sn-${s}`}
          x={PADDING_LEFT - 24}
          y={stringY(s)}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fill="#6b7280"
          fontWeight={500}
        >
          {getOpenStringName(s)}
        </text>
      ))}

      {/* フレットマーカー (インタラクティブ) */}
      {Array.from({ length: 6 }, (_, s) =>
        Array.from({ length: maxFret + 1 }, (_, f) => {
          const highlighted = isHighlighted(s, f);
          const isCorrect = isCorrectPos(s, f);
          const label = showLabelAt?.(s, f);
          const note = getNoteAt(s, f, accidental);
          // 不正解時に正解位置を緑で表示
          const markerFeedback = highlighted
            ? feedback
            : isCorrect && feedback === 'wrong'
              ? 'correct'
              : null;
          return (
            <FretMarker
              key={`m-${s}-${f}`}
              cx={posX(f)}
              cy={stringY(s)}
              highlighted={highlighted || isCorrect}
              feedback={markerFeedback}
              showLabel={label}
              noteColor={(highlighted || label) ? note : undefined}
              onClick={onPositionClick ? () => onPositionClick({ string: s, fret: f }) : undefined}
            />
          );
        })
      )}
    </svg>
  );
}
