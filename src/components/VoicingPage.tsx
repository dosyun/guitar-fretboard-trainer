import { useState } from 'react';
import { RootSelector } from './RootSelector';
import { VoicingDiagram } from './VoicingDiagram';
import { VOICINGS_6TH, VOICINGS_5TH, VOICINGS_4TH, VOICING_TYPE_LIST } from '../data/voicings';
import type { ChordVoicingType } from '../data/voicings';
import type { Accidental } from '../types';
import { Segmented } from 'antd';

interface VoicingPageProps {
  accidental: Accidental;
}

const TYPE_LABELS: Record<ChordVoicingType, string> = {
  major: 'メジャー',
  '7': '7th',
  M7: 'M7',
  m: 'マイナー',
  m7: 'm7',
  m7b5: 'm7(♭5)',
};

export function VoicingPage({ accidental }: VoicingPageProps) {
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [selectedType, setSelectedType] = useState<ChordVoicingType>('major');
  const [displayMode, setDisplayMode] = useState<'note' | 'degree' | 'both'>('both');

  const voicing6 = VOICINGS_6TH.find((v) => v.type === selectedType)!;
  const voicing5 = VOICINGS_5TH.find((v) => v.type === selectedType)!;
  const voicing4 = VOICINGS_4TH.find((v) => v.type === selectedType)!;

  return (
    <div className="flex flex-col gap-4">
      {/* バレーコードセクション */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="text-sm font-bold text-gray-700 mb-3">バレーコード</h2>

        {/* ルート音・コードタイプ・表示切替 */}
        <RootSelector current={rootNote} accidental={accidental} onChange={setRootNote} />

        <div className="flex gap-2 justify-center flex-wrap mt-3">
          {VOICING_TYPE_LIST.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedType === type
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex justify-center mt-3">
          <Segmented
            size="small"
            value={displayMode}
            onChange={(v) => setDisplayMode(v as 'note' | 'degree' | 'both')}
            options={[
              { label: '音名', value: 'note' },
              { label: '度数', value: 'degree' },
              { label: '両方', value: 'both' },
            ]}
          />
        </div>

        {/* 3列グリッド */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-gray-500 mb-2">6弦ルート</div>
            <VoicingDiagram voicing={voicing6} rootNote={rootNote} displayMode={displayMode} />
            <div className="text-xs text-gray-400 mt-1 text-center">Eフォーム系</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-gray-500 mb-2">5弦ルート</div>
            <VoicingDiagram voicing={voicing5} rootNote={rootNote} displayMode={displayMode} />
            <div className="text-xs text-gray-400 mt-1 text-center">Aフォーム系</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-bold text-gray-500 mb-2">4弦ルート</div>
            <VoicingDiagram voicing={voicing4} rootNote={rootNote} displayMode={displayMode} />
            <div className="text-xs text-gray-400 mt-1 text-center">Dフォーム系</div>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">構成音の見方</h3>
        <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">R</span>
            </div>
            <span>ルート音</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">3</span>
            </div>
            <span>その他の構成音</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-500 font-bold text-sm">×</span>
            <span>ミュート</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full border-2 border-gray-700" />
            <span>開放弦</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">「両方」モード: 上段=音名、下段=度数</p>
      </div>
    </div>
  );
}
