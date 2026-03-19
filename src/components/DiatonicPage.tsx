import { useState } from 'react';
import { RootSelector } from './RootSelector';
import { VoicingDiagram } from './VoicingDiagram';
import { VOICINGS_6TH, VOICINGS_5TH } from '../data/voicings';
import {
  MAJOR_DIATONIC, MINOR_DIATONIC,
  JAZZ_PROGRESSIONS,
  getChordName, getDegreeRoot,
} from '../data/diatonic';
import { getNoteIndex } from '../data/fretboard';
import type { Accidental, NoteName } from '../types';
import { Segmented } from 'antd';

interface DiatonicPageProps {
  accidental: Accidental;
}

export function DiatonicPage({ accidental }: DiatonicPageProps) {
  const [key, setKey] = useState<NoteName>('C');
  const [subView, setSubView] = useState<'chords' | 'progression'>('chords');
  const [scale, setScale] = useState<'major' | 'minor'>('major');
  const [rootString, setRootString] = useState<'6th' | '5th'>('6th');
  const [displayMode, setDisplayMode] = useState<'note' | 'degree' | 'both'>('both');
  const [selectedProgIdx, setSelectedProgIdx] = useState(0);

  const degrees = scale === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC;
  const voicings = rootString === '6th' ? VOICINGS_6TH : VOICINGS_5TH;
  const keyIndex = getNoteIndex(key);

  const selectedProg = JAZZ_PROGRESSIONS[selectedProgIdx];
  const progDegrees = selectedProg.scale === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC;

  const controls = (
    <div className="flex gap-2 justify-center flex-wrap mt-3">
      <Segmented
        value={rootString}
        onChange={v => setRootString(v as '6th' | '5th')}
        options={[
          { label: '6弦ルート', value: '6th' },
          { label: '5弦ルート', value: '5th' },
        ]}
      />
      <Segmented
        size="small"
        value={displayMode}
        onChange={v => setDisplayMode(v as 'note' | 'degree' | 'both')}
        options={[
          { label: '音名', value: 'note' },
          { label: '度数', value: 'degree' },
          { label: '両方', value: 'both' },
        ]}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* キー選択 */}
        <RootSelector current={key} accidental={accidental} onChange={setKey} />

        {/* サブビュー切替 */}
        <div className="flex justify-center mt-3">
          <Segmented
            value={subView}
            onChange={v => setSubView(v as 'chords' | 'progression')}
            options={[
              { label: 'コード一覧', value: 'chords' },
              { label: '進行練習', value: 'progression' },
            ]}
          />
        </div>

        {/* ===== コード一覧 ===== */}
        {subView === 'chords' && (
          <>
            <div className="flex gap-2 justify-center flex-wrap mt-3">
              <Segmented
                value={scale}
                onChange={v => setScale(v as 'major' | 'minor')}
                options={[
                  { label: 'メジャー', value: 'major' },
                  { label: 'マイナー', value: 'minor' },
                ]}
              />
            </div>
            {controls}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {degrees.map((degree) => {
                const rootNote = getDegreeRoot(keyIndex, degree.semitones) as NoteName;
                const chordName = getChordName(keyIndex, degree);
                const voicing = voicings.find(v => v.type === degree.type)!;
                return (
                  <div key={degree.roman} className="flex flex-col items-center w-[22%] sm:w-auto">
                    <div className="text-xs font-bold text-indigo-600 mb-0.5">{degree.roman}</div>
                    <VoicingDiagram
                      voicing={{ ...voicing, label: chordName }}
                      rootNote={rootNote}
                      displayMode={displayMode}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===== 進行練習 ===== */}
        {subView === 'progression' && (
          <>
            {/* 進行選択 */}
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {JAZZ_PROGRESSIONS.map((prog, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedProgIdx(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                    selectedProgIdx === i
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {prog.name}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-gray-500 mt-1">{selectedProg.description}</p>

            {/* スケール表示（マイナー/メジャー） */}
            <p className="text-center text-xs text-gray-400">
              ({selectedProg.scale === 'major' ? 'メジャースケール' : 'マイナースケール'})
            </p>

            {controls}

            {/* コードダイアグラム */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {selectedProg.degrees.map((degreeIdx, i) => {
                const degree = progDegrees[degreeIdx];
                const rootNote = getDegreeRoot(keyIndex, degree.semitones) as NoteName;
                const chordName = getChordName(keyIndex, degree);
                const voicing = voicings.find(v => v.type === degree.type)!;
                return (
                  <div key={i} className="flex flex-col items-center w-[22%] sm:w-auto">
                    <div className="text-xs font-bold text-indigo-600 mb-0.5">{degree.roman}</div>
                    <VoicingDiagram
                      voicing={{ ...voicing, label: chordName }}
                      rootNote={rootNote}
                      displayMode={displayMode}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
