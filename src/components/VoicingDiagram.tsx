import { getNoteIndex } from '../data/fretboard';
import type { NoteName } from '../types';

interface VoicingDiagramProps {
  voicing: { label: string; frets: (number | 'x')[] };
  rootNote: NoteName;
  displayMode?: 'note' | 'degree' | 'both';
  absolute?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const STRING_SPACING = 38;
const FRET_SPACING = 42;
const STRINGS = 6;
const FRETS = 4;
const PADDING_TOP = 38;
const PADDING_LEFT = 30;
const PADDING_RIGHT = 20;
const PADDING_BOTTOM = 12;
const DOT_R = 16;

const totalWidth = PADDING_LEFT + STRING_SPACING * (STRINGS - 1) + PADDING_RIGHT;
const totalHeight = PADDING_TOP + FRET_SPACING * FRETS + PADDING_BOTTOM;

const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4]; // 6弦→1弦: E,A,D,G,B,E

const DEGREE_LABELS: Record<number, string> = {
  0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4',
  6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: 'M7',
};

function getNoteName(semitone: number): string {
  return NOTE_NAMES_FLAT[((semitone % 12) + 12) % 12];
}

export function VoicingDiagram({
  voicing, rootNote, displayMode = 'note', absolute = false, selected, onClick,
}: VoicingDiagramProps) {
  const rootIdx = getNoteIndex(rootNote);

  let actualFrets: (number | 'x')[];
  if (absolute) {
    actualFrets = [...voicing.frets];
  } else {
    const rootStringIdx = voicing.frets.findIndex(f => f === 0);
    const rootOpenNote = OPEN_STRINGS[rootStringIdx];
    let baseFret = (rootIdx - rootOpenNote + 12) % 12;
    if (baseFret === 0) baseFret = 12;
    actualFrets = voicing.frets.map(offset =>
      offset === 'x' ? 'x' : baseFret + (offset as number)
    );
  }

  const nonZeroFrets = actualFrets.filter((f): f is number => f !== 'x' && f > 0);
  const minFret = nonZeroFrets.length > 0 ? Math.min(...nonZeroFrets) : 1;
  const hasOpenString = actualFrets.some(f => f === 0);
  const startFret = hasOpenString ? 1 : minFret;

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center cursor-pointer rounded-xl p-2 transition-all ${
        selected ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="text-xs font-bold text-gray-700 mb-1">{voicing.label}</div>

      <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} width={totalWidth} height={totalHeight}>
        {/* フレット番号 */}
        {startFret > 1 && (
          <text x={PADDING_LEFT - 5} y={PADDING_TOP + FRET_SPACING * 0.5}
            textAnchor="end" dominantBaseline="central" fontSize={10} fill="#6b7280">
            {startFret}fr
          </text>
        )}

        {/* ナット */}
        {startFret === 1 && (
          <rect x={PADDING_LEFT} y={PADDING_TOP - 5}
            width={STRING_SPACING * (STRINGS - 1)} height={5}
            fill="#374151" rx={1} />
        )}

        {/* フレット線 */}
        {Array.from({ length: FRETS + 1 }, (_, i) => (
          <line key={`fret-${i}`}
            x1={PADDING_LEFT} y1={PADDING_TOP + FRET_SPACING * i}
            x2={PADDING_LEFT + STRING_SPACING * (STRINGS - 1)} y2={PADDING_TOP + FRET_SPACING * i}
            stroke="#d1d5db" strokeWidth={1} />
        ))}

        {/* 弦 */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line key={`string-${i}`}
            x1={PADDING_LEFT + STRING_SPACING * i} y1={PADDING_TOP}
            x2={PADDING_LEFT + STRING_SPACING * i} y2={PADDING_TOP + FRET_SPACING * FRETS}
            stroke="#6b7280" strokeWidth={1 + (STRINGS - 1 - i) * 0.3} />
        ))}

        {/* ミュート・開放弦 */}
        {actualFrets.map((fret, strIdx) => {
          const cx = PADDING_LEFT + STRING_SPACING * strIdx;
          const cy = PADDING_TOP - 16;
          if (fret === 'x') return (
            <text key={`top-${strIdx}`} x={cx} y={cy}
              textAnchor="middle" dominantBaseline="central"
              fontSize={13} fill="#ef4444" fontWeight={700}>×</text>
          );
          if (fret === 0) return (
            <circle key={`top-${strIdx}`} cx={cx} cy={cy} r={6}
              fill="none" stroke="#374151" strokeWidth={1.5} />
          );
          return null;
        })}

        {/* ドット */}
        {actualFrets.map((fret, strIdx) => {
          if (fret === 'x' || fret === 0) return null;
          const relFret = (fret as number) - startFret + 1;
          if (relFret < 1 || relFret > FRETS) return null;

          const cx = PADDING_LEFT + STRING_SPACING * strIdx;
          const cy = PADDING_TOP + FRET_SPACING * relFret - FRET_SPACING / 2;
          const noteAtPos = (OPEN_STRINGS[strIdx] + (fret as number)) % 12;
          const isRoot = noteAtPos === rootIdx;
          const interval = ((noteAtPos - rootIdx) + 12) % 12;

          const noteName = isRoot ? 'R' : getNoteName(noteAtPos);
          const degreeName = DEGREE_LABELS[interval];

          return (
            <g key={`dot-${strIdx}`}>
              <circle cx={cx} cy={cy} r={DOT_R} fill={isRoot ? '#2563eb' : '#374151'} />
              {displayMode === 'both' ? (
                <>
                  <text x={cx} y={cy - 4.5} textAnchor="middle" dominantBaseline="central"
                    fontSize={9} fill="#fff" fontWeight={700}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {noteName}
                  </text>
                  <text x={cx} y={cy + 5.5} textAnchor="middle" dominantBaseline="central"
                    fontSize={7.5} fill={isRoot ? '#bfdbfe' : '#9ca3af'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {degreeName}
                  </text>
                </>
              ) : (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fill="#fff" fontWeight={700}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {displayMode === 'degree' ? degreeName : noteName}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* フレット番号列 */}
      <div className="text-xs text-gray-400 mt-0.5 flex">
        {actualFrets.map((f, i) => (
          <span key={i} className="text-center" style={{ width: STRING_SPACING }}>
            {f === 'x' ? '×' : f}
          </span>
        ))}
      </div>
    </div>
  );
}
