import { useState } from 'react';
import { RootSelector } from './RootSelector';
import { VoicingDiagram } from './VoicingDiagram';
import { VOICINGS_6TH, VOICINGS_5TH } from '../data/voicings';
import { MAJOR_DIATONIC, MINOR_DIATONIC, getChordName, getDegreeRoot } from '../data/diatonic';
import { getNoteIndex } from '../data/fretboard';
import type { Accidental, NoteName } from '../types';
import { Segmented } from 'antd';

interface DiatonicPageProps {
  accidental: Accidental;
}

export function DiatonicPage({ accidental }: DiatonicPageProps) {
  const [key, setKey] = useState<NoteName>('C');
  const [scale, setScale] = useState<'major' | 'minor'>('major');
  const [rootString, setRootString] = useState<'6th' | '5th'>('6th');
  const [displayMode, setDisplayMode] = useState<'note' | 'degree' | 'both'>('both');

  const degrees = scale === 'major' ? MAJOR_DIATONIC : MINOR_DIATONIC;
  const voicings = rootString === '6th' ? VOICINGS_6TH : VOICINGS_5TH;
  const keyIndex = getNoteIndex(key);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* キー選択 */}
        <RootSelector current={key} accidental={accidental} onChange={setKey} />

        {/* スケール・ルート弦・表示モード */}
        <div className="flex gap-3 justify-center flex-wrap mt-3">
          <Segmented
            value={scale}
            onChange={v => setScale(v as 'major' | 'minor')}
            options={[
              { label: 'メジャー', value: 'major' },
              { label: 'マイナー', value: 'minor' },
            ]}
          />
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

        {/* ダイアトニックコード一覧 */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {degrees.map((degree) => {
            const rootNote = getDegreeRoot(keyIndex, degree.semitones) as NoteName;
            const chordName = getChordName(keyIndex, degree);
            const voicing = voicings.find(v => v.type === degree.type)!;

            return (
              <div key={degree.roman} className="flex flex-col items-center">
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
      </div>
    </div>
  );
}
