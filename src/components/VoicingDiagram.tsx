import type { ChordVoicing } from '../data/voicings';
import { getNoteIndex } from '../data/fretboard';
import type { NoteName } from '../types';

interface VoicingDiagramProps {
  voicing: ChordVoicing;
  rootNote: NoteName;
  selected?: boolean;
  onClick?: () => void;
}

const STRING_SPACING = 20;
const FRET_SPACING = 22;
const STRINGS = 6;
const FRETS = 4; // 表示するフレット数
const PADDING_TOP = 28;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 16;
const PADDING_BOTTOM = 10;
const DOT_R = 7;

const totalWidth = PADDING_LEFT + STRING_SPACING * (STRINGS - 1) + PADDING_RIGHT;
const totalHeight = PADDING_TOP + FRET_SPACING * FRETS + PADDING_BOTTOM;

// 音名リスト（フラット系）
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 弦の開放音（MIDIノート番号 mod 12）: 6弦→1弦の順
const OPEN_STRINGS = [4, 9, 2, 7, 11, 4]; // 6弦→1弦: E,A,D,G,B,E

function getNoteName(semitone: number, useFlat = true): string {
  const idx = ((semitone % 12) + 12) % 12;
  return useFlat ? NOTE_NAMES_FLAT[idx] : NOTE_NAMES_SHARP[idx];
}

export function VoicingDiagram({ voicing, rootNote, selected, onClick }: VoicingDiagramProps) {
  const rootIdx = getNoteIndex(rootNote);

  // ルート弦を特定（最初のoffset=0の弦）
  const rootStringIdx = voicing.frets.findIndex(f => f === 0);
  const rootOpenNote = OPEN_STRINGS[rootStringIdx];
  // ルート弦でのベースフレット（バレーコードの基準フレット）
  let baseFret = (rootIdx - rootOpenNote + 12) % 12;
  if (baseFret === 0) baseFret = 12; // 開放弦ポジションは12fに

  // 実際のフレット位置を計算（ベースフレット + ボイシングオフセット）
  const actualFrets: (number | 'x')[] = voicing.frets.map((offset) => {
    if (offset === 'x') return 'x';
    return baseFret + (offset as number);
  });

  // 最小フレット（ミュート・開放除く）
  const nonZeroFrets = actualFrets.filter((f): f is number => f !== 'x' && f > 0);
  const minFret = nonZeroFrets.length > 0 ? Math.min(...nonZeroFrets) : 1;
  const startFret = minFret; // このフレットから表示開始

  return (
    <div
      onClick={onClick}
      className={`flex flex-col items-center cursor-pointer rounded-xl p-2 transition-all ${
        selected
          ? 'bg-blue-50 ring-2 ring-blue-400'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="text-xs font-bold text-gray-700 mb-1">{voicing.label}</div>

      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        width={totalWidth}
        height={totalHeight}
      >
        {/* フレット番号（左上） */}
        {startFret > 1 && (
          <text
            x={PADDING_LEFT - 4}
            y={PADDING_TOP + FRET_SPACING * 0.5}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={9}
            fill="#6b7280"
          >
            {startFret}fr
          </text>
        )}

        {/* ナット（1フレット目から始まる場合） */}
        {startFret === 1 && (
          <rect
            x={PADDING_LEFT}
            y={PADDING_TOP - 4}
            width={STRING_SPACING * (STRINGS - 1)}
            height={4}
            fill="#374151"
            rx={1}
          />
        )}

        {/* フレット線 */}
        {Array.from({ length: FRETS + 1 }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={PADDING_LEFT}
            y1={PADDING_TOP + FRET_SPACING * i}
            x2={PADDING_LEFT + STRING_SPACING * (STRINGS - 1)}
            y2={PADDING_TOP + FRET_SPACING * i}
            stroke="#d1d5db"
            strokeWidth={1}
          />
        ))}

        {/* 弦 */}
        {Array.from({ length: STRINGS }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={PADDING_LEFT + STRING_SPACING * i}
            y1={PADDING_TOP}
            x2={PADDING_LEFT + STRING_SPACING * i}
            y2={PADDING_TOP + FRET_SPACING * FRETS}
            stroke="#6b7280"
            strokeWidth={1 + (STRINGS - 1 - i) * 0.3}
          />
        ))}

        {/* ミュート・開放弦表示 */}
        {actualFrets.map((fret, strIdx) => {
          const cx = PADDING_LEFT + STRING_SPACING * strIdx;
          const cy = PADDING_TOP - 14;
          if (fret === 'x') {
            return (
              <text key={`top-${strIdx}`} x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#ef4444" fontWeight={700}>×</text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={`top-${strIdx}`} cx={cx} cy={cy} r={5} fill="none" stroke="#374151" strokeWidth={1.5} />
            );
          }
          return null;
        })}

        {/* ドット */}
        {actualFrets.map((fret, strIdx) => {
          if (fret === 'x' || fret === 0) return null;
          const relFret = (fret as number) - startFret + 1;
          if (relFret < 1 || relFret > FRETS) return null;

          const cx = PADDING_LEFT + STRING_SPACING * strIdx;
          const cy = PADDING_TOP + FRET_SPACING * relFret - FRET_SPACING / 2;

          // ルート音かチェック
          const noteAtPos = (OPEN_STRINGS[strIdx] + (fret as number)) % 12;
          const isRoot = noteAtPos === rootIdx;

          return (
            <g key={`dot-${strIdx}`}>
              <circle
                cx={cx}
                cy={cy}
                r={DOT_R}
                fill={isRoot ? '#2563eb' : '#374151'}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={7}
                fill="#fff"
                fontWeight={700}
              >
                {isRoot ? 'R' : getNoteName(noteAtPos)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* フレット番号表示 */}
      <div className="text-xs text-gray-400 mt-0.5">
        {actualFrets.map((f, i) => (
          <span key={i} className="inline-block w-4 text-center">
            {f === 'x' ? '×' : f}
          </span>
        ))}
      </div>
    </div>
  );
}
