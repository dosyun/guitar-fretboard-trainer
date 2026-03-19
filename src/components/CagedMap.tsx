import { getOpenStringName, getNoteAt } from '../data/fretboard';
import { getCagedPositions, CAGED_COLORS } from '../data/caged';
import type { Accidental, CagedFormName, NoteName, ChordType } from '../types';

interface CagedMapProps {
  maxFret: number;
  rootNote: NoteName;
  selectedForms: CagedFormName[];
  showPentatonic: boolean;
  showChordTones: boolean;
  chordType?: ChordType;
  displayMode?: 'degree' | 'note' | 'both';
  accidental?: Accidental;
}

const PADDING_LEFT = 40;
const PADDING_RIGHT = 15;
const PADDING_TOP = 35;
const PADDING_BOTTOM = 25;
const STRING_SPACING = 30;
const FRET_WIDTH = 55;
const NUT_WIDTH = 4;
const MARKER_R = 13;

const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

export function CagedMap({
  maxFret,
  rootNote,
  selectedForms,
  showPentatonic,
  showChordTones,
  chordType = 'major',
  displayMode = 'degree',
  accidental = 'flat',
}: CagedMapProps) {
  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + PADDING_BOTTOM;

  const fretX = (fret: number) =>
    PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * fret;

  const stringY = (stringIndex: number) =>
    PADDING_TOP + STRING_SPACING * (5 - stringIndex);

  const posX = (fret: number) =>
    fret === 0
      ? PADDING_LEFT - MARKER_R - 2
      : fretX(fret) - FRET_WIDTH / 2;

  // 全フォームのポジションを収集
  const allPositions = selectedForms.flatMap((formName) => {
    const positions = getCagedPositions(formName, rootNote, maxFret, chordType);
    return positions.map((p) => ({ ...p, formName }));
  });

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
          x={PADDING_LEFT - 28}
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

      {/* CAGEDポジション表示 */}
      {allPositions.map(({ pos, chordTone, pentatonic, formName }, i) => {
        const color = CAGED_COLORS[formName];
        const isChord = !!chordTone;
        const isPenta = !!pentatonic && !chordTone;

        // ペンタ非表示時はコードトーンのみ
        if (isPenta && !showPentatonic) return null;
        // コードトーン非表示時はスキップ（ペンタのみ表示）
        if (isChord && !showChordTones && !pentatonic) return null;

        const r = isChord ? MARKER_R : MARKER_R - 3;
        const label = isChord
          ? chordTone
          : pentatonic;
        const cx = posX(pos.fret);
        const cy = stringY(pos.string);

        const noteName = getNoteAt(pos.string, pos.fret, accidental);
        const textFill = isChord ? '#fff' : color.bg;

        return (
          <g key={`${formName}-${i}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={isChord ? color.bg : color.light}
              stroke={color.border}
              strokeWidth={isChord ? 2 : 1.5}
              strokeDasharray={isPenta ? '3,2' : undefined}
            />
            {displayMode === 'both' && isChord ? (
              <>
                <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
                  fontSize={6} fontWeight={700} fill={textFill}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {noteName}
                </text>
                <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="central"
                  fontSize={6} fontWeight={600} fill={textFill}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {label}
                </text>
              </>
            ) : (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isChord ? 9 : 7}
                fontWeight={700}
                fill={textFill}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {displayMode === 'note' ? noteName : label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
