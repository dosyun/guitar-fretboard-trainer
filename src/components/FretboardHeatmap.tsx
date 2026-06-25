import { getNoteLabel, getOpenStringName } from '../data/fretboard';
import { getNoteRecognitionMetrics } from '../data/practiceStore';
import { BOARD } from '../data/boardPalette';
import type { Accidental } from '../types';
import type { CellMetrics } from '../types/practice';

interface FretboardHeatmapProps {
  maxFret: number;
  accidental: Accidental;
}

// レイアウト (FretboardMap の非both設定に揃える)
const PADDING_TOP = 25;
const NUT_WIDTH = 4;
const MARKER_R = 10;
const STRING_SPACING = 24;
const FRET_WIDTH = 55;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 15;

const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

const FAST_MS = 1200;
const SLOW_MS = 4000;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 弱点 = 誤答率(0.6) + 反応の遅さ(0.4)。色: 緑(習得)→琥珀→赤(苦手)。 */
function heat(m: CellMetrics): { fill: string; opacity: number } {
  const slowness = clamp01((m.avgMs - FAST_MS) / (SLOW_MS - FAST_MS));
  const w = 0.6 * m.errorRate + 0.4 * slowness;
  const fill = w < 0.25 ? 'var(--correct)' : w < 0.55 ? 'var(--accent)' : 'var(--wrong)';
  return { fill, opacity: 0.35 + 0.55 * clamp01(Math.max(w, 0.18)) };
}

export function FretboardHeatmap({ maxFret, accidental }: FretboardHeatmapProps) {
  const metrics = getNoteRecognitionMetrics();
  const byCell = new Map<string, CellMetrics>();
  metrics.forEach((m) => byCell.set(`${m.pos.string}:${m.pos.fret}`, m));
  const hasData = metrics.length > 0;

  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + MARKER_R + 5;

  const fretX = (fret: number) => PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * fret;
  const stringY = (s: number) => PADDING_TOP + STRING_SPACING * (5 - s);
  const posX = (fret: number) => (fret === 0 ? PADDING_LEFT - MARKER_R - 2 : fretX(fret) - FRET_WIDTH / 2);

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full"
      style={{ minWidth: `${maxFret * 50}px` }}
    >
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH + FRET_WIDTH * maxFret}
        height={STRING_SPACING * 5 + STRING_SPACING}
        rx={2}
        fill={BOARD.board}
      />
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH}
        height={STRING_SPACING * 5 + STRING_SPACING}
        fill={BOARD.nut}
        rx={1}
      />

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

      {SINGLE_DOTS.filter((f) => f <= maxFret).map((f) => (
        <circle key={`dot-${f}`} cx={fretX(f) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 2.5} r={5} fill={BOARD.inlay} />
      ))}
      {DOUBLE_DOT <= maxFret && (
        <>
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 1.5} r={5} fill={BOARD.inlay} />
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 3.5} r={5} fill={BOARD.inlay} />
        </>
      )}

      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <text key={`fn-${f}`} x={fretX(f) - FRET_WIDTH / 2} y={PADDING_TOP - STRING_SPACING / 2 - 6} textAnchor="middle" fontSize={9} fill={BOARD.fretNumber}>
          {f}
        </text>
      ))}

      {Array.from({ length: 6 }, (_, s) => (
        <line key={`string-${s}`} x1={PADDING_LEFT} y1={stringY(s)} x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret} y2={stringY(s)} stroke={BOARD.string} strokeWidth={1 + s * 0.3} />
      ))}

      {Array.from({ length: 6 }, (_, s) => (
        <text key={`sn-${s}`} x={PADDING_LEFT - 24} y={stringY(s)} textAnchor="middle" dominantBaseline="central" fontSize={10} fill={BOARD.stringLabel} fontWeight={500}>
          {getOpenStringName(s)}
        </text>
      ))}

      {/* ヒートマップのセル: 出題済みのみ着色 */}
      {Array.from({ length: 6 }, (_, s) =>
        Array.from({ length: maxFret + 1 }, (_, f) => {
          const m = byCell.get(`${s}:${f}`);
          if (!m || m.n === 0) return null;
          const { fill, opacity } = heat(m);
          return (
            <g key={`h-${s}-${f}`}>
              <circle cx={posX(f)} cy={stringY(s)} r={MARKER_R} fill={fill} opacity={opacity} />
              <text
                x={posX(f)}
                y={stringY(s)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fontWeight={600}
                fill="#0e0f12"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {getNoteLabel(s, f, accidental)}
              </text>
            </g>
          );
        })
      )}

      {!hasData && (
        <text x={totalWidth / 2} y={totalHeight / 2} textAnchor="middle" dominantBaseline="central" fontSize={11} fill={BOARD.stringLabel}>
          まだ記録がありません — クイズで音名を練習すると弱点が色で見えます
        </text>
      )}
    </svg>
  );
}
