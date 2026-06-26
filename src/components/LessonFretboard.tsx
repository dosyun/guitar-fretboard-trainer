import { getNoteAt, getNoteIndex } from '../data/fretboard';
import { BOARD } from '../data/boardPalette';

export interface DemoTone {
  st: number; // ルートからの半音
  label: string; // R / 3 / 5 / 7 など
}

interface LessonFretboardProps {
  root: string;
  tones: DemoTone[];
  maxFret?: number;
}

const PADDING_TOP = 22;
const NUT_WIDTH = 4;
const MARKER_R = 11;
const STRING_SPACING = 26;
const FRET_WIDTH = 50;
const PADDING_LEFT = 30;
const PADDING_RIGHT = 12;
const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

/** レッスンの「見て分かる」用。root からの度数(tones)に一致する位置を盤面で光らせる。 */
export function LessonFretboard({ root, tones, maxFret = 7 }: LessonFretboardProps) {
  const rootIdx = getNoteIndex(root);
  const toneByPitch = new Map<number, DemoTone>();
  tones.forEach((t) => toneByPitch.set((rootIdx + t.st) % 12, t));

  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + MARKER_R + 5;
  const fretX = (f: number) => PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * f;
  const stringY = (s: number) => PADDING_TOP + STRING_SPACING * (5 - s);
  const posX = (f: number) => (f === 0 ? PADDING_LEFT - MARKER_R - 2 : fretX(f) - FRET_WIDTH / 2);

  return (
    <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="w-full" style={{ minWidth: `${maxFret * 46}px` }}>
      <rect
        x={PADDING_LEFT}
        y={PADDING_TOP - STRING_SPACING / 2}
        width={NUT_WIDTH + FRET_WIDTH * maxFret}
        height={STRING_SPACING * 5 + STRING_SPACING}
        rx={2}
        fill={BOARD.board}
      />
      <rect x={PADDING_LEFT} y={PADDING_TOP - STRING_SPACING / 2} width={NUT_WIDTH} height={STRING_SPACING * 5 + STRING_SPACING} fill={BOARD.nut} rx={1} />

      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <line key={`fr-${f}`} x1={fretX(f)} y1={PADDING_TOP - STRING_SPACING / 2} x2={fretX(f)} y2={PADDING_TOP + STRING_SPACING * 5 + STRING_SPACING / 2} stroke={BOARD.fretwire} strokeWidth={1.5} />
      ))}
      {SINGLE_DOTS.filter((f) => f <= maxFret).map((f) => (
        <circle key={`d-${f}`} cx={fretX(f) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 2.5} r={4} fill={BOARD.inlay} />
      ))}
      {DOUBLE_DOT <= maxFret && (
        <>
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 1.5} r={4} fill={BOARD.inlay} />
          <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2} cy={PADDING_TOP + STRING_SPACING * 3.5} r={4} fill={BOARD.inlay} />
        </>
      )}
      {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
        <text key={`fn-${f}`} x={fretX(f) - FRET_WIDTH / 2} y={PADDING_TOP - STRING_SPACING / 2 - 5} textAnchor="middle" fontSize={9} fill={BOARD.fretNumber}>
          {f}
        </text>
      ))}
      {Array.from({ length: 6 }, (_, s) => (
        <line key={`st-${s}`} x1={PADDING_LEFT} y1={stringY(s)} x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret} y2={stringY(s)} stroke={BOARD.string} strokeWidth={1 + s * 0.3} />
      ))}

      {/* 度数マーカー */}
      {Array.from({ length: 6 }, (_, s) =>
        Array.from({ length: maxFret + 1 }, (_, f) => {
          const pitch = getNoteIndex(getNoteAt(s, f, 'sharp'));
          const t = toneByPitch.get(pitch);
          if (!t) return null;
          const isRoot = t.st === 0;
          return (
            <g key={`m-${s}-${f}`}>
              <circle
                cx={posX(f)}
                cy={stringY(s)}
                r={MARKER_R}
                fill={isRoot ? 'var(--accent)' : '#3f566b'}
                stroke={isRoot ? '#c9821a' : '#2c3e50'}
                strokeWidth={1.5}
              />
              <text
                x={posX(f)}
                y={stringY(s)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={700}
                fill={isRoot ? '#1b1813' : '#ffffff'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {t.label}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}
