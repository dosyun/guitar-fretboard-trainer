import { getNoteAt, getNoteLabel, getIntervalAt, NOTE_COLORS } from '../data/fretboard';
import { getOpenStringName } from '../data/fretboard';
import type { Accidental, NoteName } from '../types';

interface FretboardMapProps {
  maxFret: number;
  accidental: Accidental;
  displayMode: 'notes' | 'intervals';
  rootNote: NoteName;
  highlightStrings?: number[];  // 絞り込み対象の弦
  highlightFretRange?: [number, number]; // 絞り込み対象のフレット範囲
  highlightNotes?: string[] | null; // 絞り込み対象の音名 (null=全て)
}

// レイアウト定数
const PADDING_TOP = 25;
const NUT_WIDTH = 4;

const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

// 度数に応じた色
const INTERVAL_COLORS: Record<string, string> = {
  'R': '#dc2626',    // 赤 (ルート)
  'm2': '#9ca3af',
  'M2': '#6b7280',
  'm3': '#2563eb',   // 青系
  'M3': '#3b82f6',
  'P4': '#16a34a',   // 緑
  '#4/b5': '#a855f7', // 紫
  'P5': '#ea580c',   // オレンジ
  'm6': '#64748b',
  'M6': '#475569',
  'm7': '#0891b2',   // シアン
  'M7': '#06b6d4',
};

export function FretboardMap({
  maxFret,
  accidental,
  displayMode,
  rootNote,
  highlightStrings,
  highlightFretRange,
  highlightNotes,
}: FretboardMapProps) {
  // both表示時はマーカーを大きくする
  const isBoth = accidental === 'both';
  const MARKER_R = isBoth ? 15 : 10;
  const STRING_SPACING = isBoth ? 40 : 24;
  const FRET_WIDTH = isBoth ? 80 : 55;
  const PADDING_LEFT = isBoth ? 50 : 40;
  const PADDING_RIGHT = 15;
  const FONT_SIZE = isBoth ? 7 : 8;

  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + MARKER_R + 5;

  const fretX = (fret: number) =>
    PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * fret;

  const stringY = (stringIndex: number) =>
    PADDING_TOP + STRING_SPACING * (5 - stringIndex);

  const posX = (fret: number) =>
    fret === 0
      ? PADDING_LEFT - MARKER_R - 2
      : fretX(fret) - FRET_WIDTH / 2;

  const isInRange = (s: number, f: number) => {
    const stringOk = !highlightStrings || highlightStrings.includes(s);
    const fretOk = !highlightFretRange || (f >= highlightFretRange[0] && f <= highlightFretRange[1]);
    const noteOk = !highlightNotes || highlightNotes.includes(getNoteAt(s, f, accidental));
    return stringOk && fretOk && noteOk;
  };

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full"
      style={{ minWidth: `${maxFret * (isBoth ? 70 : 50)}px` }}
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

      {/* ポジションマーク */}
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
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 1.5} r={5} fill="#d6d3d1" />
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 3.5} r={5} fill="#d6d3d1" />
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
      {Array.from({ length: 6 }, (_, s) => (
        <line
          key={`string-${s}`}
          x1={PADDING_LEFT}
          y1={stringY(s)}
          x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret}
          y2={stringY(s)}
          stroke="#78716c"
          strokeWidth={1 + s * 0.3}
        />
      ))}

      {/* 弦名ラベル */}
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

      {/* ノート/度数表示 */}
      {Array.from({ length: 6 }, (_, s) =>
        Array.from({ length: maxFret + 1 }, (_, f) => {
          const inRange = isInRange(s, f);
          const noteKey = getNoteAt(s, f, 'sharp'); // 色引き用は常にsharp
          const noteDisplay = displayMode === 'notes' ? getNoteLabel(s, f, accidental) : '';
          const interval = getIntervalAt(s, f, rootNote);
          const label = displayMode === 'notes' ? noteDisplay : interval;
          const noteColor = NOTE_COLORS[noteKey] || { bg: '#6b7280', text: '#fff', border: '#4b5563' };
          const intervalColor = INTERVAL_COLORS[interval] || '#6b7280';

          const circleFill = displayMode === 'notes'
            ? noteColor.bg
            : interval === 'R' ? '#dc2626' : (inRange ? '#fff' : '#f3f4f6');
          const circleStroke = displayMode === 'notes'
            ? noteColor.border
            : (inRange ? intervalColor : '#d1d5db');
          const textFill = displayMode === 'notes'
            ? noteColor.text
            : interval === 'R' ? '#fff' : intervalColor;

          return (
            <g key={`n-${s}-${f}`} opacity={inRange ? 1 : 0.15}>
              <circle
                cx={posX(f)}
                cy={stringY(s)}
                r={MARKER_R}
                fill={circleFill}
                stroke={circleStroke}
                strokeWidth={1.5}
              />
              <text
                x={posX(f)}
                y={stringY(s)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={displayMode === 'intervals' && interval === 'R' ? 10 : FONT_SIZE}
                fontWeight={600}
                fill={textFill}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}
