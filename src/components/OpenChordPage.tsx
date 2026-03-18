import { useState } from 'react';
import { VoicingDiagram } from './VoicingDiagram';
import { OPEN_CHORDS, OPEN_CHORD_CATEGORY_LABELS } from '../data/voicings';
import type { OpenChordCategory } from '../data/voicings';
import type { NoteName } from '../types';
import { Segmented } from 'antd';

const CATEGORY_ORDER: OpenChordCategory[] = ['major', 'minor', '7', 'M7', 'm7', 'sus', 'add9'];

export function OpenChordPage() {
  const [selectedCategory, setSelectedCategory] = useState<OpenChordCategory | 'all'>('all');
  const [displayMode, setDisplayMode] = useState<'note' | 'degree' | 'both'>('both');

  const filtered = selectedCategory === 'all'
    ? OPEN_CHORDS
    : OPEN_CHORDS.filter(c => c.category === selectedCategory);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        {/* カテゴリフィルタ */}
        <div className="flex gap-1.5 flex-wrap justify-center mb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium border-2 transition-all ${
              selectedCategory === 'all'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            全て
          </button>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border-2 transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {OPEN_CHORD_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* 表示モード */}
        <div className="flex justify-center mb-4">
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

        {/* コードグリッド */}
        <div className="flex flex-wrap justify-center gap-2">
          {filtered.map(chord => (
            <VoicingDiagram
              key={chord.name}
              voicing={chord}
              rootNote={chord.root as NoteName}
              displayMode={displayMode}
              absolute
            />
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">構成音の見方</h3>
        <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">R</span>
            </div>
            <span>ルート音</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
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
        <p className="text-xs text-gray-400 mt-2">「両方」モード: 上段=音名、下段=度数（♭3=マイナー3度、♭7=マイナー7度 など）</p>
      </div>
    </div>
  );
}
