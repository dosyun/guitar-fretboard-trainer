import { useState } from 'react';
import { RootSelector } from './RootSelector';
import { VoicingDiagram } from './VoicingDiagram';
import { VOICINGS_6TH, VOICINGS_5TH, VOICING_TYPE_LIST } from '../data/voicings';
import type { ChordVoicingType } from '../data/voicings';
import type { Accidental, NoteName } from '../types';

interface VoicingPageProps {
  accidental: Accidental;
}

export function VoicingPage({ accidental }: VoicingPageProps) {
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [selectedType, setSelectedType] = useState<ChordVoicingType>('major');

  const TYPE_LABELS: Record<ChordVoicingType, string> = {
    major: 'メジャー',
    '7': '7th',
    M7: 'M7',
    m: 'マイナー',
    m7: 'm7',
    m7b5: 'm7(♭5)',
  };

  const voicing6 = VOICINGS_6TH.find((v) => v.type === selectedType)!;
  const voicing5 = VOICINGS_5TH.find((v) => v.type === selectedType)!;

  return (
    <div className="flex flex-col gap-4">
      {/* ルート音選択 */}
      <RootSelector current={rootNote} accidental={accidental} onChange={setRootNote} />

      {/* コードタイプ選択 */}
      <div className="flex gap-2 justify-center flex-wrap">
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

      {/* ボイシングダイアグラム */}
      <div className="grid grid-cols-2 gap-4">
        {/* 6弦ルート */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3 text-center">6弦ルート</h3>
          <div className="flex justify-center">
            <VoicingDiagram
              voicing={voicing6}
              rootNote={rootNote}
            />
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">
            <span className="font-medium text-gray-600">{rootNote}{selectedType === 'major' ? '' : selectedType === 'm' ? 'm' : selectedType}</span>
            {' '}バレーコード（Eフォーム系）
          </div>
        </div>

        {/* 5弦ルート */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-500 mb-3 text-center">5弦ルート</h3>
          <div className="flex justify-center">
            <VoicingDiagram
              voicing={voicing5}
              rootNote={rootNote}
            />
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">
            <span className="font-medium text-gray-600">{rootNote}{selectedType === 'major' ? '' : selectedType === 'm' ? 'm' : selectedType}</span>
            {' '}バレーコード（Aフォーム系）
          </div>
        </div>
      </div>

      {/* コード構成音説明 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">構成音の見方</h3>
        <div className="flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">R</span>
            </div>
            <span>ルート音</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">G</span>
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
      </div>
    </div>
  );
}
