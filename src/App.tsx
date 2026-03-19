import { useState } from 'react';
import { Fretboard } from './components/Fretboard';
import { FretboardMap } from './components/FretboardMap';
import { NoteSelector } from './components/NoteSelector';
import { IntervalSelector } from './components/IntervalSelector';
import { ModeSelector } from './components/ModeSelector';
import { RootSelector } from './components/RootSelector';
import { ScoreBoard } from './components/ScoreBoard';
import { SettingsPanel } from './components/SettingsPanel';
import { PracticeRangeSelector } from './components/PracticeRangeSelector';
import { CagedMap } from './components/CagedMap';
import { CagedFormSelector } from './components/CagedFormSelector';
import { CagedLegend } from './components/CagedLegend';
import { CagedQuiz } from './components/CagedQuiz';
import { VoicingPage } from './components/VoicingPage';
import { DiatonicPage } from './components/DiatonicPage';
import { ArpeggioPage } from './components/ArpeggioPage';
import { OpenChordPage } from './components/OpenChordPage';
import { HelpPage } from './components/HelpPage';
import { ScaleMap } from './components/ScaleMap';
import { ScaleQuiz } from './components/ScaleQuiz';
import { useQuiz } from './hooks/useQuiz';
import { useScore } from './hooks/useScore';
import { useCagedQuiz } from './hooks/useCagedQuiz';
import { useScaleQuiz } from './hooks/useScaleQuiz';
import { getNoteAt, getIntervalAt, getAllPositionsForNote } from './data/fretboard';
import { CAGED_ORDER } from './data/caged';
import { SCALES, SCALE_LIST, SCALE_COLORS } from './data/scales';
import type { ScaleName } from './data/scales';
import { Tabs as AntTabs, Segmented, Switch } from 'antd';
import type { Accidental, FretPosition, NoteName, CagedFormName } from './types';
import './index.css';

type AppView = 'map' | 'quiz' | 'scale' | 'caged' | 'voicing' | 'open' | 'diatonic' | 'arpeggio' | 'help';

function App() {
  const [accidental, setAccidental] = useState<Accidental>('flat');
  const [view, setView] = useState<AppView>('map');
  const [mapDisplay, setMapDisplay] = useState<'notes' | 'intervals'>('notes');
  const [mapRoot, setMapRoot] = useState<NoteName>('C');
  const [maxFret, setMaxFret] = useState(12);

  // 練習範囲
  const [selectedStrings, setSelectedStrings] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [fretRange, setFretRange] = useState<[number, number]>([0, 12]);
  const [selectedNotes, setSelectedNotes] = useState<string[] | null>(null);

  // CAGED state
  const [cagedSubView, setCagedSubView] = useState<'display' | 'quiz'>('display');
  const [cagedRoot, setCagedRoot] = useState<NoteName>('C');
  const [selectedForms, setSelectedForms] = useState<CagedFormName[]>([...CAGED_ORDER]);
  const [showPentatonic, setShowPentatonic] = useState(false);
  const [showChordTones, setShowChordTones] = useState(true);
  const [cagedDisplayMode, setCagedDisplayMode] = useState<'degree' | 'note' | 'both'>('degree');

  // Scale state
  const [scaleSubView, setScaleSubView] = useState<'display' | 'quiz'>('display');
  const [scaleRoot, setScaleRoot] = useState<NoteName>('A');
  const [scaleName, setScaleName] = useState<ScaleName>('minor-pentatonic');
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [scaleDisplayMode, setScaleDisplayMode] = useState<'degree' | 'note' | 'both'>('degree');

  const { score, recordCorrect, recordWrong, resetScore } = useScore();

  const {
    quiz,
    started,
    showHint,
    start,
    answerNote,
    answerInterval,
    answerPosition,
    setMode,
    setRootNote,
    toggleHint,
    correctPositions,
  } = useQuiz({
    maxFret,
    accidental,
    strings: selectedStrings,
    fretRange,
    noteFilter: selectedNotes,
    onCorrect: recordCorrect,
    onWrong: recordWrong,
  });

  // CAGED用の別スコア
  const {
    score: cagedScore,
    recordCorrect: cagedRecordCorrect,
    recordWrong: cagedRecordWrong,
    resetScore: cagedResetScore,
  } = useScore();

  const cagedQuiz = useCagedQuiz({
    rootNote: cagedRoot,
    maxFret,
    onCorrect: cagedRecordCorrect,
    onWrong: cagedRecordWrong,
  });

  // Scale quiz
  const {
    score: scaleScore,
    recordCorrect: scaleRecordCorrect,
    recordWrong: scaleRecordWrong,
    resetScore: scaleResetScore,
  } = useScore();

  const scaleQuiz = useScaleQuiz({
    rootNote: scaleRoot,
    scaleName,
    maxFret,
    boxFretRange: selectedBox !== null ? undefined : undefined, // TODO: box range
    onCorrect: scaleRecordCorrect,
    onWrong: scaleRecordWrong,
  });

  const handlePositionClick = (pos: FretPosition) => {
    if (quiz.mode === 'note-to-position' && started) {
      answerPosition(pos);
    }
  };

  // ヒント生成
  const getHintText = (): string | null => {
    if (!quiz.currentPosition) return null;
    const { string: s, fret: f } = quiz.currentPosition;
    const openNote = getNoteAt(s, 0, accidental);
    const hints: string[] = [];

    if (quiz.mode === 'position-to-note' || quiz.mode === 'interval') {
      hints.push(`${openNote}弦の${f}フレット = ${openNote}から半音${f}つ上`);

      if (f === 5 && s > 0 && s !== 4) {
        const nextOpen = getNoteAt(s - 1, 0, accidental);
        hints.push(`5フレット = 隣の弦(${nextOpen})の開放音`);
      }
      if (f === 4 && s === 4) {
        hints.push(`2弦の4フレット = 1弦の開放音(E)`);
      }
      if (f === 12) {
        hints.push(`12フレット = 開放弦と同じ音(${openNote})`);
      }
      if (f >= 2 && s >= 2) {
        hints.push(`2フレット上・2弦低い = 同じ音(オクターブ)`);
      }
    }

    return hints.length > 0 ? hints.join(' / ') : null;
  };

  // フレットボード上のラベル表示
  const showLabelAt = (s: number, f: number): string | undefined => {
    if (showHint && quiz.currentPosition && !quiz.feedback) {
      if (f === 0 && s === quiz.currentPosition.string) return getNoteAt(s, 0, accidental);
      if (f === 5 && s === quiz.currentPosition.string) return getNoteAt(s, 5, accidental);
      if (f === 12 && s === quiz.currentPosition.string) return getNoteAt(s, 12, accidental);
    }

    if (!started || !quiz.feedback) return undefined;

    if (quiz.mode === 'position-to-note' && quiz.currentPosition) {
      if (s === quiz.currentPosition.string && f === quiz.currentPosition.fret) {
        return getNoteAt(s, f, accidental);
      }
    }
    if (quiz.mode === 'interval' && quiz.currentPosition) {
      if (s === quiz.currentPosition.string && f === quiz.currentPosition.fret) {
        return getIntervalAt(s, f, quiz.rootNote);
      }
    }
    if (quiz.mode === 'note-to-position' && quiz.feedback === 'wrong' && quiz.currentNote) {
      const positions = getAllPositionsForNote(quiz.currentNote, maxFret, accidental);
      if (positions.some((p) => p.string === s && p.fret === f)) {
        return quiz.currentNote;
      }
    }
    return undefined;
  };

  const getPrompt = () => {
    if (!started) return null;
    if (quiz.mode === 'position-to-note' && quiz.currentPosition) {
      return `${6 - quiz.currentPosition.string}弦 ${quiz.currentPosition.fret}フレットの音名は？`;
    }
    if (quiz.mode === 'note-to-position' && quiz.currentNote) {
      return `「${quiz.currentNote}」の位置をタップしてください`;
    }
    if (quiz.mode === 'interval' && quiz.currentPosition) {
      return `ルート ${quiz.rootNote} に対する度数は？ (${6 - quiz.currentPosition.string}弦 ${quiz.currentPosition.fret}フレット)`;
    }
    return null;
  };

  const getFeedbackMsg = () => {
    if (!quiz.feedback) return null;
    if (quiz.feedback === 'correct') return '正解!';
    if (quiz.correctAnswer) return `不正解... 正解: ${quiz.correctAnswer}`;
    return '不正解...';
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4f8' }}>
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-4 shadow-lg">
        <h1 className="text-xl font-bold text-white text-center tracking-tight">
          Guitar Fretboard Trainer
        </h1>
      </header>

      <div className="sticky top-0 z-10 bg-white px-4 pt-2 shadow-sm">
        <AntTabs
          activeKey={view}
          onChange={(v) => setView(v as AppView)}
          centered
          size="large"
          items={[
            { key: 'map', label: '指板マップ' },
            { key: 'quiz', label: 'クイズ' },
            { key: 'scale', label: 'スケール' },
            { key: 'caged', label: 'CAGED' },
            { key: 'voicing', label: 'ボイシング' },
            { key: 'open', label: 'オープン' },
            { key: 'diatonic', label: 'ダイアトニック' },
            { key: 'arpeggio', label: 'アルペジオ' },
            { key: 'help', label: '使い方' },
          ]}
        />
      </div>

      <div className="flex-1 flex flex-col gap-3 px-4 pb-4 w-full">

        {/* ===== マップビュー ===== */}
        {view === 'map' && (
          <>
            <div className="flex justify-center">
              <Segmented
                value={mapDisplay}
                onChange={(v) => setMapDisplay(v as 'notes' | 'intervals')}
                options={[
                  { label: '音名', value: 'notes' },
                  { label: '度数', value: 'intervals' },
                ]}
              />
            </div>

            {mapDisplay === 'intervals' && (
              <RootSelector current={mapRoot} accidental={accidental} onChange={setMapRoot} />
            )}

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm p-2">
              <FretboardMap
                maxFret={maxFret}
                accidental={accidental}
                displayMode={mapDisplay}
                rootNote={mapRoot}
                highlightStrings={selectedStrings}
                highlightFretRange={fretRange}
                highlightNotes={selectedNotes}
              />
            </div>

            <PracticeRangeSelector
              selectedStrings={selectedStrings}
              fretRange={fretRange}
              maxFret={maxFret}
              accidental={accidental}
              selectedNotes={selectedNotes}
              onStringsChange={setSelectedStrings}
              onFretRangeChange={setFretRange}
              onNotesChange={setSelectedNotes}
            />

            <p className="text-xs text-gray-400 text-center">
              マップで全体を確認してからクイズに挑戦しよう。範囲を絞って段階的に覚えるのがおすすめ!
            </p>
          </>
        )}

        {/* ===== クイズビュー ===== */}
        {view === 'quiz' && (
          <>
            <ModeSelector
              current={quiz.mode}
              onChange={(mode) => { setMode(mode); resetScore(); }}
            />

            {quiz.mode === 'interval' && (
              <RootSelector
                current={quiz.rootNote}
                accidental={accidental}
                onChange={(root) => { setRootNote(root as NoteName); resetScore(); }}
              />
            )}

            {started && <ScoreBoard score={score} />}

            {started && (
              <div className="text-center">
                <p className="text-gray-700 font-medium">{getPrompt()}</p>
                {quiz.feedback && (
                  <p className={`text-lg font-bold mt-1 ${
                    quiz.feedback === 'correct' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {getFeedbackMsg()}
                  </p>
                )}
              </div>
            )}

            {started && !quiz.feedback && (quiz.mode === 'position-to-note' || quiz.mode === 'interval') && (
              <div className="text-center">
                <button onClick={toggleHint} className="text-xs text-blue-500 hover:text-blue-700 underline">
                  {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
                </button>
                {showHint && <p className="text-xs text-gray-500 mt-1">{getHintText()}</p>}
              </div>
            )}

            <div className="overflow-x-auto bg-white rounded-xl shadow-sm p-2">
              <Fretboard
                maxFret={maxFret}
                accidental={accidental}
                highlightPosition={quiz.currentPosition}
                feedback={quiz.feedback}
                correctPositions={correctPositions}
                showLabelAt={showLabelAt}
                onPositionClick={started && quiz.mode === 'note-to-position' ? handlePositionClick : undefined}
              />
            </div>

            {started && quiz.mode === 'position-to-note' && (
              <NoteSelector accidental={accidental} feedback={quiz.feedback} correctAnswer={quiz.correctAnswer} onSelect={answerNote} />
            )}
            {started && quiz.mode === 'interval' && (
              <IntervalSelector feedback={quiz.feedback} correctAnswer={quiz.correctAnswer} onSelect={answerInterval} />
            )}

            {!started && (
              <button
                onClick={() => start(quiz.mode, quiz.rootNote)}
                className="mx-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                スタート
              </button>
            )}

            <PracticeRangeSelector
              selectedStrings={selectedStrings}
              fretRange={fretRange}
              maxFret={maxFret}
              accidental={accidental}
              selectedNotes={selectedNotes}
              onStringsChange={(s) => { setSelectedStrings(s); if (started) start(quiz.mode, quiz.rootNote); resetScore(); }}
              onFretRangeChange={(r) => { setFretRange(r); if (started) start(quiz.mode, quiz.rootNote); resetScore(); }}
              onNotesChange={(n) => { setSelectedNotes(n); if (started) start(quiz.mode, quiz.rootNote); resetScore(); }}
            />
          </>
        )}

        {/* ===== スケールビュー ===== */}
        {view === 'scale' && (
          <>
            {/* サブタブ */}
            <div className="flex justify-center">
              <Segmented
                value={scaleSubView}
                onChange={(v) => { if (v === 'quiz') scaleResetScore(); setScaleSubView(v as 'display' | 'quiz'); }}
                options={[
                  { label: '表示', value: 'display' },
                  { label: 'クイズ', value: 'quiz' },
                ]}
              />
            </div>

            {/* スケール選択 */}
            <div className="flex gap-1 justify-center flex-wrap">
              {SCALE_LIST.map((s) => {
                const sc = SCALE_COLORS[s];
                const selected = scaleName === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setScaleName(s); setSelectedBox(null); }}
                    style={selected ? { background: sc.bg, color: '#fff', borderColor: sc.border } : {}}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-opacity ${
                      selected ? '' : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {SCALES[s].label}
                  </button>
                );
              })}
            </div>

            {/* ルート音 */}
            <RootSelector current={scaleRoot} accidental={accidental} onChange={setScaleRoot} />

            {scaleSubView === 'display' && (
              <>
                {/* ポジション選択 */}
                <div className="flex gap-1 justify-center items-center">
                  <span className="text-sm text-gray-500">ポジション:</span>
                  <button
                    onClick={() => setSelectedBox(null)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedBox === null ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    全体
                  </button>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBox(i)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        selectedBox === i ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {/* 表示モード */}
                <div className="flex justify-center">
                  <Segmented
                    size="small"
                    value={scaleDisplayMode}
                    onChange={v => setScaleDisplayMode(v as 'degree' | 'note' | 'both')}
                    options={[
                      { label: '度数', value: 'degree' },
                      { label: '音名', value: 'note' },
                      { label: '両方', value: 'both' },
                    ]}
                  />
                </div>

                {/* スケールマップ */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm p-2">
                  <ScaleMap
                    maxFret={maxFret}
                    rootNote={scaleRoot}
                    scaleName={scaleName}
                    selectedBox={selectedBox}
                    displayMode={scaleDisplayMode}
                    accidental={accidental}
                  />
                </div>
              </>
            )}

            {scaleSubView === 'quiz' && (
              <ScaleQuiz
                quiz={scaleQuiz.quiz}
                started={scaleQuiz.started}
                score={scaleScore}
                scaleName={scaleName}
                rootNote={scaleRoot}
                accidental={accidental}
                maxFret={maxFret}
                degreeLabels={scaleQuiz.degreeLabels}
                onStart={scaleQuiz.start}
                onSetMode={(mode) => { scaleQuiz.setMode(mode); scaleResetScore(); }}
                onAnswerInOrOut={scaleQuiz.answerInOrOut}
                onAnswerDegree={scaleQuiz.answerDegree}
              />
            )}
          </>
        )}

        {/* ===== CAGEDビュー ===== */}
        {view === 'caged' && (
          <>
            {/* サブタブ: 表示 / クイズ */}
            <div className="flex justify-center">
              <Segmented
                value={cagedSubView}
                onChange={(v) => { if (v === 'quiz') cagedResetScore(); setCagedSubView(v as 'display' | 'quiz'); }}
                options={[
                  { label: '表示', value: 'display' },
                  { label: 'クイズ', value: 'quiz' },
                ]}
              />
            </div>

            {/* ルート音選択 */}
            <RootSelector current={cagedRoot} accidental={accidental} onChange={setCagedRoot} />

            {cagedSubView === 'display' && (
              <>
                {/* フォーム選択 */}
                <CagedFormSelector selectedForms={selectedForms} onChange={setSelectedForms} />

                {/* 表示トグル */}
                <div className="flex gap-4 justify-center items-center flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <Switch size="small" checked={showChordTones} onChange={setShowChordTones} />
                    コードトーン
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <Switch size="small" checked={showPentatonic} onChange={setShowPentatonic} />
                    ペンタトニック
                  </label>
                  <Segmented
                    size="small"
                    value={cagedDisplayMode}
                    onChange={v => setCagedDisplayMode(v as 'degree' | 'note' | 'both')}
                    options={[
                      { label: '度数', value: 'degree' },
                      { label: '音名', value: 'note' },
                      { label: '両方', value: 'both' },
                    ]}
                  />
                </div>

                {/* CAGED指板マップ */}
                <div className="overflow-x-auto bg-white rounded-xl shadow-sm p-2">
                  <CagedMap
                    maxFret={maxFret}
                    rootNote={cagedRoot}
                    selectedForms={selectedForms}
                    showPentatonic={showPentatonic}
                    showChordTones={showChordTones}
                    displayMode={cagedDisplayMode}
                    accidental={accidental}
                  />
                </div>

                {/* 凡例 */}
                <CagedLegend showPentatonic={showPentatonic} />
              </>
            )}

            {cagedSubView === 'quiz' && (
              <CagedQuiz
                quiz={cagedQuiz.quiz}
                started={cagedQuiz.started}
                score={cagedScore}
                rootNote={cagedRoot}
                accidental={accidental}
                maxFret={maxFret}
                onStart={cagedQuiz.start}
                onSetMode={(mode) => { cagedQuiz.setMode(mode); cagedResetScore(); }}
                onAnswerForm={cagedQuiz.answerForm}
                onAnswerChordTone={cagedQuiz.answerChordTone}
                onAnswerPosition={cagedQuiz.answerPosition}
              />
            )}
          </>
        )}

        {/* ===== ボイシングビュー ===== */}
        {view === 'voicing' && (
          <VoicingPage accidental={accidental} />
        )}

        {/* ===== オープンコードビュー ===== */}
        {view === 'open' && <OpenChordPage />}

        {/* ===== ダイアトニックビュー ===== */}
        {view === 'diatonic' && <DiatonicPage accidental={accidental} />}

        {/* ===== アルペジオビュー ===== */}
        {view === 'arpeggio' && <ArpeggioPage accidental={accidental} />}

        {/* ===== 説明書ビュー ===== */}
        {view === 'help' && <HelpPage />}

        {/* 設定 */}
        <SettingsPanel
          accidental={accidental}
          maxFret={maxFret}
          onAccidentalChange={setAccidental}
          onMaxFretChange={(f) => { setMaxFret(f); setFretRange([0, f]); }}
          onReset={() => { resetScore(); cagedResetScore(); }}
        />
      </div>
    </div>
  );
}

export default App;
