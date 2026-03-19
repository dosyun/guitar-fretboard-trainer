import { useState } from 'react';
import { RootSelector } from './RootSelector';
import { getNoteIndex, getNoteAt, getOpenStringName } from '../data/fretboard';
import type { Accidental, NoteName } from '../types';
import { Segmented } from 'antd';

const OPEN_STRINGS_MIDI = [40, 45, 50, 55, 59, 64]; // 6弦→1弦 E2,A2,D3,G3,B3,E4
const OPEN_STRINGS_NOTE = [4, 9, 2, 7, 11, 4];      // 6弦→1弦 E,A,D,G,B,E (mod12)

const CHORD_TYPES = [
  { key: 'M7',   label: 'maj7',    intervals: [0, 4, 7, 11] },
  { key: '7',    label: '7th',     intervals: [0, 4, 7, 10] },
  { key: 'm7',   label: 'm7',      intervals: [0, 3, 7, 10] },
  { key: 'm7b5', label: 'm7(♭5)', intervals: [0, 3, 6, 10] },
];

const DEGREE_LABELS: Record<number, string> = {
  0: 'R', 3: '♭3', 4: '3', 6: '♭5', 7: '5', 10: '♭7', 11: 'M7',
};

const FRET_RANGES = [
  { label: '全体',    min: 0, max: 12 },
  { label: '開放〜5F', min: 0, max: 5  },
  { label: '5〜9F',  min: 5, max: 9  },
  { label: '9〜12F', min: 9, max: 12 },
];

const PADDING_LEFT = 40;
const PADDING_RIGHT = 15;
const PADDING_TOP = 35;
const PADDING_BOTTOM = 30;
const STRING_SPACING = 30;
const FRET_WIDTH = 55;
const NUT_WIDTH = 4;
const MARKER_R = 14;
const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

interface ArpeggioPageProps {
  accidental: Accidental;
}

export function ArpeggioPage({ accidental }: ArpeggioPageProps) {
  const [root, setRoot] = useState<NoteName>('A');
  const [chordTypeIdx, setChordTypeIdx] = useState(2); // m7
  const [rangeIdx, setRangeIdx] = useState(0);
  const [labelMode, setLabelMode] = useState<'number' | 'degree' | 'note' | 'both'>('number');

  const chordType = CHORD_TYPES[chordTypeIdx];
  const range = FRET_RANGES[rangeIdx];
  const rootIdx = getNoteIndex(root);

  // 全ポジション取得 → MIDIでソート
  const allPositions: { string: number; fret: number; interval: number; midi: number }[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      const note = (OPEN_STRINGS_NOTE[s] + f) % 12;
      const interval = (note - rootIdx + 12) % 12;
      if (chordType.intervals.includes(interval)) {
        allPositions.push({ string: s, fret: f, interval, midi: OPEN_STRINGS_MIDI[s] + f });
      }
    }
  }
  allPositions.sort((a, b) => a.midi - b.midi);

  // 範囲内・範囲外に分ける
  const inRangePositions = allPositions.filter(p => p.fret >= range.min && p.fret <= range.max);
  const outOfRange = allPositions.filter(p => p.fret < range.min || p.fret > range.max);

  // 範囲内の音だけで番号を振り直す（同じMIDIには同じ番号）
  const uniqueMidisInRange = [...new Set(inRangePositions.map(p => p.midi))].sort((a, b) => a - b);
  const midiToNum = new Map(uniqueMidisInRange.map((midi, i) => [midi, i + 1]));
  const inRange = inRangePositions.map(p => ({ ...p, num: midiToNum.get(p.midi)! }));

  const maxFret = 12;
  const totalWidth = PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret + PADDING_RIGHT;
  const totalHeight = PADDING_TOP + STRING_SPACING * 5 + PADDING_BOTTOM;

  const fretX = (f: number) => PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * f;
  const stringY = (s: number) => PADDING_TOP + STRING_SPACING * (5 - s);
  const posX = (f: number) => f === 0 ? PADDING_LEFT - MARKER_R - 2 : fretX(f) - FRET_WIDTH / 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* ルート選択 */}
        <RootSelector current={root} accidental={accidental} onChange={setRoot} />

        {/* コードタイプ */}
        <div className="flex gap-2 justify-center flex-wrap mt-3">
          {CHORD_TYPES.map((ct, i) => (
            <button key={ct.key} onClick={() => setChordTypeIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                chordTypeIdx === i
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {root}{ct.label}
            </button>
          ))}
        </div>

        {/* フレット範囲 */}
        <div className="flex gap-2 justify-center flex-wrap mt-3">
          {FRET_RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border-2 transition-all ${
                rangeIdx === i
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* 表示モード */}
        <div className="flex justify-center mt-3">
          <Segmented
            size="small"
            value={labelMode}
            onChange={v => setLabelMode(v as 'number' | 'degree' | 'note' | 'both')}
            options={[
              { label: '番号', value: 'number' },
              { label: '度数', value: 'degree' },
              { label: '音名', value: 'note' },
              { label: '両方', value: 'both' },
            ]}
          />
        </div>

        {/* フレットボード */}
        <div className="overflow-x-auto mt-4 bg-white rounded-xl">
          <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            className="w-full" style={{ minWidth: `${maxFret * 50}px` }}>

            {/* 背景 */}
            <rect x={PADDING_LEFT} y={PADDING_TOP - STRING_SPACING / 2}
              width={NUT_WIDTH + FRET_WIDTH * maxFret}
              height={STRING_SPACING * 5 + STRING_SPACING}
              rx={2} fill="#fef3c7" />

            {/* ナット */}
            <rect x={PADDING_LEFT} y={PADDING_TOP - STRING_SPACING / 2}
              width={NUT_WIDTH} height={STRING_SPACING * 5 + STRING_SPACING}
              fill="#78716c" rx={1} />

            {/* フレット線 */}
            {Array.from({ length: maxFret }, (_, i) => i + 1).map(f => (
              <line key={f} x1={fretX(f)} y1={PADDING_TOP - STRING_SPACING / 2}
                x2={fretX(f)} y2={PADDING_TOP + STRING_SPACING * 5 + STRING_SPACING / 2}
                stroke="#a8a29e" strokeWidth={1.5} />
            ))}

            {/* ポジションマーク */}
            {SINGLE_DOTS.map(f => (
              <circle key={f} cx={fretX(f) - FRET_WIDTH / 2}
                cy={PADDING_TOP + STRING_SPACING * 2.5} r={5} fill="#d6d3d1" />
            ))}
            <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
              cy={PADDING_TOP + STRING_SPACING * 1.5} r={5} fill="#d6d3d1" />
            <circle cx={fretX(DOUBLE_DOT) - FRET_WIDTH / 2}
              cy={PADDING_TOP + STRING_SPACING * 3.5} r={5} fill="#d6d3d1" />

            {/* フレット番号 */}
            {Array.from({ length: maxFret }, (_, i) => i + 1).map(f => (
              <text key={f} x={fretX(f) - FRET_WIDTH / 2}
                y={PADDING_TOP - STRING_SPACING / 2 - 6}
                textAnchor="middle" fontSize={9} fill="#9ca3af">{f}</text>
            ))}

            {/* 弦 */}
            {Array.from({ length: 6 }, (_, s) => (
              <line key={s} x1={PADDING_LEFT} y1={stringY(s)}
                x2={PADDING_LEFT + NUT_WIDTH + FRET_WIDTH * maxFret} y2={stringY(s)}
                stroke="#78716c" strokeWidth={1 + s * 0.3} />
            ))}

            {/* 弦名 */}
            {Array.from({ length: 6 }, (_, s) => (
              <text key={s} x={PADDING_LEFT - 28} y={stringY(s)}
                textAnchor="middle" dominantBaseline="central"
                fontSize={10} fill="#6b7280" fontWeight={500}>
                {getOpenStringName(s)}
              </text>
            ))}

            {/* 範囲外ドット（薄く） */}
            {rangeIdx !== 0 && outOfRange.map(p => (
              <circle key={`dim-${p.string}-${p.fret}`}
                cx={posX(p.fret)} cy={stringY(p.string)}
                r={MARKER_R - 4} fill="#94a3b8" opacity={0.25} />
            ))}

            {/* 範囲内ドット */}
            {inRange.map(p => {
              const cx = posX(p.fret);
              const cy = stringY(p.string);
              const isRoot = p.interval === 0;
              const noteName = getNoteAt(p.string, p.fret, accidental);
              const degreeName = DEGREE_LABELS[p.interval];
              const r = MARKER_R;

              return (
                <g key={`${p.string}-${p.fret}`}>
                  <circle cx={cx} cy={cy} r={r}
                    fill={isRoot ? '#2563eb' : '#374151'}
                    strokeWidth={0} />
                  {labelMode === 'both' ? (
                    <>
                      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="central"
                        fontSize={7} fontWeight={700} fill="#fff"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {noteName}
                      </text>
                      <text x={cx} y={cy + 5} textAnchor="middle" dominantBaseline="central"
                        fontSize={7} fontWeight={600} fill={isRoot ? '#bfdbfe' : '#93c5fd'}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {degreeName}
                      </text>
                    </>
                  ) : (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                      fontSize={11} fontWeight={700} fill="#fff"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      {labelMode === 'number' ? String(p.num) :
                       labelMode === 'degree' ? degreeName : noteName}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 説明 */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-xs text-gray-500 flex flex-col gap-1">
        <p>番号 = 低い音から高い音へのアルペジオ順。</p>
        <p>フレット範囲を絞ると、そのポジション内での練習に使えます。</p>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-600" />ルート音
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded-full bg-gray-700" />コードトーン
          </span>
        </div>
      </div>
    </div>
  );
}
