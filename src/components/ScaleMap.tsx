import { getOpenStringName } from '../data/fretboard';
import { getScalePositions, getScaleBoxPositions, SCALE_COLORS } from '../data/scales';
import type { NoteName } from '../types';
import type { ScaleName } from '../data/scales';

interface ScaleMapProps {
  maxFret: number;
  rootNote: NoteName;
  scaleName: ScaleName;
  selectedBox: number | null; // null = 全表示, 0-4 = 特定ボックス
}

const PADDING_LEFT = 40;
const PADDING_RIGHT = 15;
const PADDING_TOP = 35;
const PADDING_BOTTOM = 40;
const STRING_SPACING = 30;
const FRET_WIDTH = 55;
const NUT_WIDTH = 4;
const MARKER_R = 13;

const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

export function ScaleMap({ maxFret, rootNote, scaleName, selectedBox }: ScaleMapProps) {
  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + PADDING_BOTTOM;
  const color = SCALE_COLORS[scaleName];

  const fretX = (fret: number) => PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * fret;
  const stringY = (s: number) => PADDING_TOP + STRING_SPACING * (5 - s);
  const posX = (fret: number) => fret === 0 ? PADDING_LEFT - MARKER_R - 2 : fretX(fret) - FRET_WIDTH / 2;

  // ポジション取得
  const allPositions = getScalePositions(scaleName, rootNote, maxFret);
  const boxes = getScaleBoxPositions(scaleName, rootNote, maxFret);

  // ボックス範囲のハイライト用
  const activeBox = selectedBox !== null ? boxes[selectedBox] : null;

  // 表示するポジション
  const displayPositions = activeBox
    ? activeBox.positions
    : allPositions;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className="w-full"
      style={{ minWidth: `${maxFret * 50}px` }}
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

      {/* ボックスポジションの背景ハイライト */}
      {selectedBox === null && boxes.map((box, i) => {
        const x1 = box.fretRange[0] === 0
          ? PADDING_LEFT - MARKER_R - 6
          : fretX(box.fretRange[0]) - FRET_WIDTH / 2 - 4;
        const x2 = fretX(box.fretRange[1]) - FRET_WIDTH / 2 + MARKER_R + 4;
        return (
          <rect
            key={`box-${i}`}
            x={x1}
            y={PADDING_TOP - STRING_SPACING / 2 - 2}
            width={x2 - x1}
            height={STRING_SPACING * 5 + STRING_SPACING + 4}
            rx={4}
            fill={color.light}
            opacity={0.3}
            stroke={color.border}
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        );
      })}
      {activeBox && (
        <rect
          x={activeBox.fretRange[0] === 0
            ? PADDING_LEFT - MARKER_R - 6
            : fretX(activeBox.fretRange[0]) - FRET_WIDTH / 2 - 4}
          y={PADDING_TOP - STRING_SPACING / 2 - 2}
          width={
            (fretX(activeBox.fretRange[1]) - FRET_WIDTH / 2 + MARKER_R + 4) -
            (activeBox.fretRange[0] === 0
              ? PADDING_LEFT - MARKER_R - 6
              : fretX(activeBox.fretRange[0]) - FRET_WIDTH / 2 - 4)
          }
          height={STRING_SPACING * 5 + STRING_SPACING + 4}
          rx={4}
          fill={color.light}
          opacity={0.4}
          stroke={color.border}
          strokeWidth={2}
        />
      )}

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
        <line key={`fret-${f}`} x1={fretX(f)} y1={PADDING_TOP - STRING_SPACING / 2} x2={fretX(f)} y2={PADDING_TOP + STRING_SPACING * 5 + STRING_SPACING / 2} stroke="#a8a29e" strokeWidth={1.5} />
      ))}

      {/* ポジションマーク */}
      {SINGLE_DOTS.filter((f) => f <= maxFret).map((f) => (
        <circle key={`dot-${f}`} cx={fretX(f) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 2.5} r={5} fill="#d6d3d1" />
      ))}
      {DOUBLE_DOT <= maxFret && (
        <>
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 1.5} r={5} fill="#d6d3d1" />
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 3.5} r={5} fill="#d6d3d1" />
        </>
      )}

      {/* フレット番号 */}
      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <text key={`fn-${f}`} x={fretX(f) - FRET_WIDTH / 2} y={PADDING_TOP - STRING_SPACING / 2 - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{f}</text>
      ))}

      {/* 弦 */}
      {Array.from({ length: 6 }, (_, s) => (
        <line key={`s-${s}`} x1={PADDING_LEFT} y1={stringY(s)} x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret} y2={stringY(s)} stroke="#78716c" strokeWidth={1 + s * 0.3} />
      ))}

      {/* 弦名 */}
      {Array.from({ length: 6 }, (_, s) => (
        <text key={`sn-${s}`} x={PADDING_LEFT - 28} y={stringY(s)} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#6b7280" fontWeight={500}>{getOpenStringName(s)}</text>
      ))}

      {/* スケール音 (全表示時は範囲外を薄く) */}
      {(selectedBox !== null ? allPositions : []).map(({ pos, degree }, i) => {
        const isInBox = displayPositions.some(
          (dp) => dp.pos.string === pos.string && dp.pos.fret === pos.fret
        );
        if (isInBox) return null; // activeBoxのポジションは後で描画
        return (
          <g key={`dim-${i}`} opacity={0.15}>
            <circle cx={posX(pos.fret)} cy={stringY(pos.string)} r={MARKER_R - 3} fill={color.light} stroke={color.border} strokeWidth={1} />
            <text x={posX(pos.fret)} y={stringY(pos.string)} textAnchor="middle" dominantBaseline="central" fontSize={7} fontWeight={600} fill={color.bg} style={{ pointerEvents: 'none' }}>{degree}</text>
          </g>
        );
      })}

      {/* アクティブなポジション */}
      {displayPositions.map(({ pos, degree }, i) => {
        const isRoot = degree === 'R';
        const r = isRoot ? MARKER_R + 1 : MARKER_R;
        return (
          <g key={`pos-${i}`}>
            <circle
              cx={posX(pos.fret)}
              cy={stringY(pos.string)}
              r={r}
              fill={isRoot ? color.bg : color.light}
              stroke={color.border}
              strokeWidth={isRoot ? 2.5 : 1.5}
            />
            <text
              x={posX(pos.fret)}
              y={stringY(pos.string)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isRoot ? 10 : 8}
              fontWeight={700}
              fill={isRoot ? '#fff' : color.bg}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {degree}
            </text>
          </g>
        );
      })}

      {/* ボックス番号ラベル */}
      {selectedBox === null && boxes.map((box, i) => {
        const cx = (fretX(box.fretRange[0]) + fretX(box.fretRange[1])) / 2 - FRET_WIDTH / 2;
        return (
          <text
            key={`bl-${i}`}
            x={cx}
            y={PADDING_TOP + STRING_SPACING * 5 + STRING_SPACING / 2 + 12}
            textAnchor="middle"
            fontSize={10}
            fill={color.bg}
            fontWeight={700}
          >
            Pos.{i + 1}
          </text>
        );
      })}
    </svg>
  );
}
