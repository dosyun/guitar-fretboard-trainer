import { useEffect, useRef } from 'react';
import { FretMarker } from './FretMarker';
import { getOpenStringName, getNoteAt, getMidiAt } from '../data/fretboard';
import { playMidi } from '../data/audio';
import { BOARD } from '../data/boardPalette';
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

  // スマホの横スクロール指板で、出題セルが画面外なら中央へ自動スクロール
  const svgRef = useRef<SVGSVGElement>(null);
  const hlString = highlightPosition?.string;
  const hlFret = highlightPosition?.fret;
  useEffect(() => {
    if (hlFret == null || !svgRef.current) return;
    let el: HTMLElement | null = svgRef.current.parentElement;
    while (el && el.scrollWidth <= el.clientWidth + 1) el = el.parentElement;
    if (!el) return;
    const renderedWidth = svgRef.current.getBoundingClientRect().width;
    const xPx = (posX(hlFret) / totalWidth) * renderedWidth;
    el.scrollTo({ left: xPx - el.clientWidth / 2, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlString, hlFret]);

  const isHighlighted = (s: number, f: number) =>
    highlightPosition?.string === s && highlightPosition?.fret === f;

  const isCorrectPos = (s: number, f: number) =>
    correctPositions?.some((p) => p.string === s && p.fret === f) ?? false;

  return (
    <svg
      ref={svgRef}
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
        fill={BOARD.board}
      />

      {/* ナット */}
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH}
        height={STRING_SPACING * 5 + STRING_SPACING}
        fill={BOARD.nut}
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
          stroke={BOARD.fretwire}
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
          fill={BOARD.inlay}
        />
      ))}
      {DOUBLE_DOT <= maxFret && (
        <>
          <circle
            cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
            cy={PADDING_TOP + STRING_SPACING * 1.5}
            r={5}
            fill={BOARD.inlay}
          />
          <circle
            cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
            cy={PADDING_TOP + STRING_SPACING * 3.5}
            r={5}
            fill={BOARD.inlay}
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
          fill={BOARD.fretNumber}
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
            stroke={BOARD.string}
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
          fill={BOARD.stringLabel}
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
              // 出題位置のハイライトは中立色(琥珀)。音高カラーは答え/正解表示(label)のときだけ。
              noteColor={label ? note : undefined}
              onClick={onPositionClick ? () => { playMidi(getMidiAt(s, f)); onPositionClick({ string: s, fret: f }); } : undefined}
            />
          );
        })
      )}
    </svg>
  );
}
