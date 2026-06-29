import { useState, useEffect } from 'react';
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
import { HomePage } from './components/HomePage';
import { ResultScreen } from './components/ResultScreen';
import { TriadBuilder } from './components/TriadBuilder';
import { KeyFunctionQuiz } from './components/KeyFunctionQuiz';
import { ChordToneQuiz } from './components/ChordToneQuiz';
import { ChordProgressionQuiz } from './components/ChordProgressionQuiz';
import { LessonsPage } from './components/LessonsPage';
import { StatsPage } from './components/StatsPage';
import { ScaleMap } from './components/ScaleMap';
import { ScaleQuiz } from './components/ScaleQuiz';
import { useQuiz } from './hooks/useQuiz';
import { useScore } from './hooks/useScore';
import { useSession } from './hooks/useSession';
import { getLastSession, recordPracticeDay } from './data/practiceStore';
import { recordSkill } from './data/skillStore';
import type { SessionSummary } from './types/practice';
import type { Phase } from './data/phases';
import { useCagedQuiz } from './hooks/useCagedQuiz';
import { useScaleQuiz } from './hooks/useScaleQuiz';
import { getNoteAt, getIntervalAt, getAllPositionsForNote, INTERVAL_NAMES } from './data/fretboard';
import { toneWhy } from './data/theory';
import { CAGED_ORDER } from './data/caged';
import { SCALES, SCALE_LIST, SCALE_COLORS } from './data/scales';
import type { ScaleName } from './data/scales';
import { Tabs as AntTabs, Segmented, Switch } from 'antd';
import type { Accidental, FretPosition, NoteName, CagedFormName } from './types';
import './index.css';

type AppView = 'home' | 'practice' | 'theory' | 'stats' | 'settings';
type TheoryTab = 'learn' | 'map' | 'scale' | 'caged' | 'voicing' | 'open' | 'diatonic' | 'arpeggio';

// 理論ビューの1行解説（“調べる”を“分かる”に）
const THEORY_INTRO: Record<TheoryTab, string> = {
  learn: '',
  map: '指板の全ポジションの音名・度数を一覧。まず全体像を掴むのに。',
  scale: 'スケール＝ソロやメロディで使う音の集合。ボックスごとに段階的に。',
  caged: 'CAGED＝C/A/G/E/D の5フォームで指板全体を1つに繋ぐ考え方。',
  voicing: 'バレーコードの押さえ方を度数で。ルートのある弦でフォームが決まる。',
  open: '開放弦を使うコード。最初に覚える定番フォーム集。',
  diatonic: 'キーで使えるコードの基本セット＋定番進行。曲はこの中で動く。',
  arpeggio: 'コードの構成音を1音ずつ並べる。アドリブやメロディの土台。',
};

const THEORY_TABS: { key: TheoryTab; label: string }[] = [
  { key: 'learn', label: '学ぶ' },
  { key: 'map', label: '指板マップ' },
  { key: 'scale', label: 'スケール' },
  { key: 'caged', label: 'CAGED' },
  { key: 'voicing', label: 'ボイシング' },
  { key: 'open', label: 'オープン' },
  { key: 'diatonic', label: 'ダイアトニック' },
  { key: 'arpeggio', label: 'アルペジオ' },
];

function App() {
  const [accidental, setAccidental] = useState<Accidental>('flat');
  const [view, setView] = useState<AppView>('home');
  const [theoryTab, setTheoryTab] = useState<TheoryTab>('learn');
  const [learnOpenId, setLearnOpenId] = useState<string | undefined>(undefined);
  const [settingsShowHelp, setSettingsShowHelp] = useState(false);
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
  const session = useSession();
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null; kind: 'daily' | 'challenge' } | null>(null);
  const [sessionTarget, setSessionTarget] = useState<number | null>(null);
  const [sessionKind, setSessionKind] = useState<'daily' | 'challenge'>('challenge');
  const [challengeLength, setChallengeLength] = useState<number | null>(10);
  const [dailyLength, setDailyLength] = useState(15);
  const [practiceMode, setPracticeMode] = useState<'basic' | 'chord-tone' | 'progression' | 'triad' | 'key-func'>('basic');

  const {
    quiz,
    started,
    showHint,
    start,
    stop,
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
    onAttempt: (input) => {
      session.record(input);
      recordSkill(input.quizType === 'interval' ? 'degree' : 'note', input.isCorrect);
    },
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

  // 度数モードの「なぜ?」（その場で理解：半音数と役割）
  const getIntervalWhy = (): string | null => {
    if (quiz.mode !== 'interval' || !quiz.feedback || !quiz.currentPosition) return null;
    const deg = getIntervalAt(quiz.currentPosition.string, quiz.currentPosition.fret, quiz.rootNote);
    const note = getNoteAt(quiz.currentPosition.string, quiz.currentPosition.fret, accidental);
    return toneWhy(deg, INTERVAL_NAMES.indexOf(deg), quiz.rootNote, note);
  };

  // ===== 練習セッション制御 =====

  // チャレンジ（自由練習）: ランダム・選んだ問題数・100%でクリア。
  const handleStart = () => {
    setResult(null);
    resetScore();
    setSessionKind('challenge');
    setSessionTarget(challengeLength);
    session.startSession('free');
    start(quiz.mode, quiz.rootNote, undefined, false);
  };

  // 練習/Homeからの「学ぶ」導線: 理論>学ぶ へ。lessonId 指定でそのレッスンを直接開く。
  const goToLearn = (lessonId?: string) => {
    setLearnOpenId(lessonId);
    setTheoryTab('learn');
    setView('theory');
  };

  // レッスンの「見る/練習する」導線: 理論サブタブ or 練習モードへ。
  const handleLessonGoto = (target: string) => {
    if (target === 'practice-chord') { setPracticeMode('chord-tone'); setResult(null); setView('practice'); }
    else if (target === 'practice-prog') { setPracticeMode('progression'); setResult(null); setView('practice'); }
    else setTheoryTab(target as TheoryTab);
  };

  // フェーズ起動: 範囲をフェーズのスコープに設定（範囲内は弱点優先）。
  const handleStartPhase = (p: Phase) => {
    setSelectedStrings(p.strings);
    setFretRange(p.fretRange);
    setSelectedNotes(p.notes);
    setResult(null);
    resetScore();
    setSessionKind('challenge');
    setSessionTarget(challengeLength);
    session.startSession('free');
    setView('practice');
    start(p.mode, quiz.rootNote, { strings: p.strings, fretRange: p.fretRange, noteFilter: p.notes }, true);
  };

  // 弱点ドリル: 指定した音だけを N問(既定10)・ノート→位置で集中練習（ループを閉じる導線）。
  const handleStartDrill = (note: string, count = 10) => {
    const scope = { strings: [0, 1, 2, 3, 4, 5], fretRange: [0, maxFret] as [number, number], noteFilter: [note] };
    setSelectedStrings(scope.strings);
    setFretRange(scope.fretRange);
    setSelectedNotes([note]);
    setResult(null);
    resetScore();
    setSessionKind('challenge');
    setSessionTarget(count);
    session.startSession('free');
    setView('practice');
    start('note-to-position', quiz.rootNote, scope, true);
  };

  // 今日の練習: 選んだ問題数(既定15)・位置→音名・弱点優先。Homeから起動。
  const handleStartDaily = () => {
    setResult(null);
    resetScore();
    setSessionKind('daily');
    setSessionTarget(dailyLength);
    session.startSession('daily');
    setView('practice');
    start('position-to-note', quiz.rootNote, undefined, true);
  };

  const handleEnd = () => {
    const prev = getLastSession(quiz.mode); // 保存前 = 前回
    const summary = session.finalize();     // 今回を保存
    stop();
    setSessionTarget(null);
    if (summary) {
      recordPracticeDay(); // 連続練習日数を更新
      setResult({ summary, prev, kind: sessionKind });
    }
  };

  // モード・範囲・ルートの変更時にセッションを仕切り直す（チャレンジ扱い）
  const restartSession = () => {
    if (started) { setSessionKind('challenge'); setSessionTarget(challengeLength); session.startSession('free'); }
  };

  // 規定数に達したら自動終了して結果へ
  useEffect(() => {
    if (view === 'practice' && sessionTarget != null && started && !result && session.count >= sessionTarget) {
      handleEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.count, sessionTarget, started, result, view]);

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header
        className="bg-surface border-b border-hair py-3 px-4"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <h1 className="font-mono text-base font-medium text-ink text-center flex items-center justify-center gap-2">
          <span className="inline-block size-2 rounded-sm bg-accent" aria-hidden="true" />
          Guitar Fretboard Trainer
        </h1>
      </header>

      <div className="sticky top-0 z-nav bg-surface px-4 pt-2 border-b border-hair">
        <AntTabs
          activeKey={view}
          onChange={(v) => setView(v as AppView)}
          centered
          size="large"
          items={[
            { key: 'home', label: 'ホーム' },
            { key: 'practice', label: '練習' },
            { key: 'theory', label: '理論' },
            { key: 'stats', label: '成績' },
            { key: 'settings', label: '設定' },
          ]}
        />
      </div>

      <div className="flex-1 flex flex-col gap-3 px-4 pb-4 w-full">

        {/* ===== ホームビュー ===== */}
        {view === 'home' && (
          <HomePage
            accidental={accidental}
            maxFret={maxFret}
            dailyLength={dailyLength}
            onDailyLengthChange={setDailyLength}
            onStartDaily={handleStartDaily}
            onStartPractice={() => setView('practice')}
            onStartPhase={handleStartPhase}
            onOpenStats={() => setView('stats')}
            onShowHelp={() => { setSettingsShowHelp(true); setView('settings'); }}
            onLearn={goToLearn}
          />
        )}

        {/* ===== 理論ビュー: サブナビ ===== */}
        {view === 'theory' && (
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {THEORY_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheoryTab(t.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  theoryTab === t.key
                    ? 'bg-accent-soft text-accent border-accent'
                    : 'bg-panel text-dim border-hair'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ===== 学ぶ（レッスン） ===== */}
        {view === 'theory' && theoryTab === 'learn' && (
          <LessonsPage
            onGoto={handleLessonGoto}
            openLessonId={learnOpenId}
            onConsumeOpen={() => setLearnOpenId(undefined)}
          />
        )}

        {/* 理論ビューの1行解説 */}
        {view === 'theory' && theoryTab !== 'learn' && THEORY_INTRO[theoryTab] && (
          <p className="text-xs text-dim text-center text-pretty">{THEORY_INTRO[theoryTab]}</p>
        )}

        {/* ===== マップビュー ===== */}
        {view === 'theory' && theoryTab === 'map' && (
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

            <div className="overflow-x-auto bg-surface rounded-xl border border-hair p-2">
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

            <p className="text-xs text-dim text-center text-pretty">
              マップで全体を確認してからクイズに挑戦しよう。範囲を絞って段階的に覚えるのがおすすめ!
            </p>
          </>
        )}

        {/* ===== 練習ビュー ===== */}
        {view === 'practice' && !result && (
          <div className="flex justify-center overflow-x-auto">
            <Segmented
              value={practiceMode}
              onChange={(v) => { setPracticeMode(v as 'basic' | 'chord-tone' | 'progression' | 'triad' | 'key-func'); setResult(null); }}
              options={[
                { label: '基本', value: 'basic' },
                { label: 'コードトーン', value: 'chord-tone' },
                { label: '進行', value: 'progression' },
                { label: 'トライアド', value: 'triad' },
                { label: 'キー機能', value: 'key-func' },
              ]}
            />
          </div>
        )}

        {view === 'practice' && practiceMode === 'chord-tone' && (
          <ChordToneQuiz accidental={accidental} maxFret={maxFret} onLearn={goToLearn} />
        )}

        {view === 'practice' && practiceMode === 'triad' && (
          <TriadBuilder accidental={accidental} maxFret={maxFret} onLearn={goToLearn} />
        )}

        {view === 'practice' && practiceMode === 'key-func' && (
          <KeyFunctionQuiz accidental={accidental} onLearn={goToLearn} />
        )}

        {view === 'practice' && practiceMode === 'progression' && (
          <ChordProgressionQuiz accidental={accidental} maxFret={maxFret} onLearn={goToLearn} />
        )}

        {view === 'practice' && practiceMode === 'basic' && result && (
          <ResultScreen
            summary={result.summary}
            prev={result.prev}
            challenge={result.kind === 'challenge'}
            accidental={accidental}
            onDrill={handleStartDrill}
            onRestart={() => (result.kind === 'daily' ? handleStartDaily() : handleStart())}
            onClose={() => setResult(null)}
          />
        )}
        {view === 'practice' && practiceMode === 'basic' && !result && (
          <>
            <ModeSelector
              current={quiz.mode}
              onChange={(mode) => { setMode(mode); resetScore(); restartSession(); }}
            />

            {quiz.mode === 'interval' && (
              <RootSelector
                current={quiz.rootNote}
                accidental={accidental}
                onChange={(root) => { setRootNote(root as NoteName); resetScore(); restartSession(); }}
              />
            )}

            {started && <ScoreBoard score={score} />}

            {started && sessionTarget != null && (
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-accent bg-accent-soft border border-accent rounded-full px-2.5 py-0.5">
                  {sessionKind === 'daily' ? '今日の練習（弱点優先）' : 'チャレンジ'}{' '}
                  <span className="font-mono tabular-nums">{session.count}/{sessionTarget}</span>
                </span>
              </div>
            )}

            {started && (
              <div className="text-center">
                <p className="text-ink font-medium">{getPrompt()}</p>
                {quiz.feedback && (
                  <p className={`text-lg font-bold mt-1 ${
                    quiz.feedback === 'correct' ? 'text-correct' : 'text-wrong'
                  }`}>
                    {getFeedbackMsg()}
                  </p>
                )}
                {quiz.mode === 'interval' && quiz.feedback && (
                  <p className="text-xs text-dim mt-1 font-mono text-pretty">{getIntervalWhy()}</p>
                )}
              </div>
            )}

            {started && !quiz.feedback && (quiz.mode === 'position-to-note' || quiz.mode === 'interval') && (
              <div className="text-center">
                <button onClick={toggleHint} className="text-xs text-accent hover:opacity-80 underline">
                  {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
                </button>
                {showHint && <p className="text-xs text-dim mt-1">{getHintText()}</p>}
              </div>
            )}

            <div className="overflow-x-auto bg-surface rounded-xl border border-hair p-2">
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

            {started && (
              <button
                onClick={handleEnd}
                className="mx-auto px-6 py-2 text-sm bg-panel text-dim border border-hair rounded-lg hover:bg-accent-soft transition-colors"
              >
                終了して結果を見る
              </button>
            )}

            {!started && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-dim">問題数</span>
                  <Segmented
                    size="small"
                    value={challengeLength ?? 0}
                    onChange={(v) => setChallengeLength(v === 0 ? null : (v as number))}
                    options={[
                      { label: '10', value: 10 },
                      { label: '20', value: 20 },
                      { label: '50', value: 50 },
                      { label: '∞', value: 0 },
                    ]}
                  />
                </div>
                <button
                  onClick={handleStart}
                  className="px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
                >
                  チャレンジ開始
                </button>
                {quiz.mode === 'interval' && (
                  <button onClick={() => goToLearn()} className="text-xs text-accent hover:opacity-80 underline">
                    度数がわからない？ まず学ぶ →
                  </button>
                )}
              </div>
            )}

            <PracticeRangeSelector
              selectedStrings={selectedStrings}
              fretRange={fretRange}
              maxFret={maxFret}
              accidental={accidental}
              selectedNotes={selectedNotes}
              onStringsChange={(s) => { setSelectedStrings(s); if (started) { start(quiz.mode, quiz.rootNote); session.startSession('free'); } resetScore(); }}
              onFretRangeChange={(r) => { setFretRange(r); if (started) { start(quiz.mode, quiz.rootNote); session.startSession('free'); } resetScore(); }}
              onNotesChange={(n) => { setSelectedNotes(n); if (started) { start(quiz.mode, quiz.rootNote); session.startSession('free'); } resetScore(); }}
            />
          </>
        )}

        {/* ===== 成績ビュー ===== */}
        {view === 'stats' && <StatsPage maxFret={maxFret} accidental={accidental} onDrill={handleStartDrill} />}

        {/* ===== スケールビュー ===== */}
        {view === 'theory' && theoryTab === 'scale' && (
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
                      selected ? '' : 'bg-panel text-dim border-hair'
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
                  <span className="text-sm text-dim">ポジション:</span>
                  <button
                    onClick={() => setSelectedBox(null)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      selectedBox === null ? 'bg-accent-soft text-accent' : 'bg-panel text-dim'
                    }`}
                  >
                    全体
                  </button>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedBox(i)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        selectedBox === i ? 'bg-accent-soft text-accent' : 'bg-panel text-dim'
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
                <div className="overflow-x-auto bg-surface rounded-xl border border-hair p-2">
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
        {view === 'theory' && theoryTab === 'caged' && (
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
                  <label className="flex items-center gap-2 text-sm text-dim">
                    <Switch size="small" checked={showChordTones} onChange={setShowChordTones} />
                    コードトーン
                  </label>
                  <label className="flex items-center gap-2 text-sm text-dim">
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
                <div className="overflow-x-auto bg-surface rounded-xl border border-hair p-2">
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
        {view === 'theory' && theoryTab === 'voicing' && (
          <VoicingPage accidental={accidental} />
        )}

        {/* ===== オープンコードビュー ===== */}
        {view === 'theory' && theoryTab === 'open' && <OpenChordPage />}

        {/* ===== ダイアトニックビュー ===== */}
        {view === 'theory' && theoryTab === 'diatonic' && <DiatonicPage accidental={accidental} />}

        {/* ===== アルペジオビュー ===== */}
        {view === 'theory' && theoryTab === 'arpeggio' && <ArpeggioPage accidental={accidental} />}

        {/* ===== 設定ビュー（設定＋使い方） ===== */}
        {view === 'settings' && (
          <div className="space-y-5">
            <SettingsPanel
              accidental={accidental}
              maxFret={maxFret}
              onAccidentalChange={setAccidental}
              onMaxFretChange={(f) => { setMaxFret(f); setFretRange([0, f]); }}
              onReset={() => { resetScore(); cagedResetScore(); }}
            />
            <div className="flex justify-center">
              <button
                onClick={() => setSettingsShowHelp((v) => !v)}
                className="text-sm text-accent hover:opacity-80 underline"
              >
                {settingsShowHelp ? '使い方ガイドを閉じる' : '使い方ガイドを開く'}
              </button>
            </div>
            {settingsShowHelp && <HelpPage />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
