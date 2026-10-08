import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playChord, playMidi } from '../data/audio';
import { getMidiAt, getNoteIndex, getNoteNames } from '../data/fretboard';
import {
  generateEarPhrase, transposeEarPhrase, judgeEarPhrase, getPhraseDegreeLabels,
  getPhraseMotion, getPhraseScalePositions, PHRASE_LEVELS,
  type EarPhrase, type PhraseLevel, type PhraseRange,
} from '../data/earPhrase';
import { getLastSession } from '../data/practiceStore';
import { recordSkill, type PhraseSkillAttempt } from '../data/skillStore';
import { useSession } from '../hooks/useSession';
import { t } from '../i18n';
import type { Accidental } from '../types';
import type { AttemptInput, SessionSummary } from '../types/practice';
import { PracticeRangeSelector } from './PracticeRangeSelector';
import { QuizFooter, QuizScore } from './QuizChrome';
import { ResultScreen } from './ResultScreen';

const ALL_STRINGS = [0, 1, 2, 3, 4, 5];
const DEFAULT_RANGE: [number, number] = [0, 12];
const NOTE_STEP_MS = 550;
const BUTTON = 'px-4 py-2 rounded-lg bg-panel text-ink border border-hair hover:bg-accent-soft disabled:opacity-50 font-mono';
const MOTION = { up: '↑', down: '↓', same: '→' };

function noteCountLabel(min: number, max: number) {
  return min === max ? t('{0}音', min) : t('{0}〜{1}音', min, max);
}

// maxScaleStep は音階上の段数。1 は隣の音だけ、7 はオクターブ。
function motionLabel(maxScaleStep: number) {
  switch (maxScaleStep) {
    case 1: return t('隣の音へ順に動くだけ');
    case 2: return t('3度までの跳躍');
    case 3: return t('4度までの跳躍');
    case 4: return t('5度までの跳躍');
    case 5: return t('6度までの跳躍');
    case 6: return t('7度までの跳躍');
    default: return t('オクターブまでの跳躍');
  }
}

export interface EarPhraseQuizProps {
  accidental: Accidental;
  onLearn?: () => void;
  strings?: number[];
  fretRange?: [number, number];
  maxFret?: number;
}

export function EarPhraseQuiz({
  accidental, onLearn, strings = ALL_STRINGS, fretRange = DEFAULT_RANGE, maxFret = 12,
}: EarPhraseQuizProps) {
  const [level, setLevel] = useState<PhraseLevel>(1);
  const [allowOctave, setAllowOctave] = useState(PHRASE_LEVELS[1].allowOctave);
  const [selectedStrings, setStrings] = useState(strings);
  const [selectedRange, setRange] = useState<[number, number]>(fretRange);
  const [selectedNotes, setNotes] = useState<string[] | null>(null);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState<EarPhrase | null>(null);
  const [answer, setAnswer] = useState<number[]>([]);
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [playCount, setPlayCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ summary: SessionSummary; prev: SessionSummary | null } | null>(null);
  const { startSession, record, finalize, count, correct: sessionCorrect } = useSession();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shownAt = useRef(0);
  const judged = useRef(false);
  const busy = useRef(false);
  const listens = useRef(0);
  const entered = useRef<number[]>([]);
  const noteNames = getNoteNames(accidental);
  const limit = Math.max(0, Math.floor(maxFret));
  const range = useMemo<PhraseRange>(() => ({
    strings: selectedStrings,
    fretRange: [
      Math.max(0, Math.min(limit, selectedRange[0])),
      Math.max(0, Math.min(limit, selectedRange[1])),
    ],
    notes: selectedNotes?.map(getNoteIndex),
  }), [selectedStrings, selectedRange, selectedNotes, limit]);

  const cancelPlayback = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
  }, []);

  useEffect(() => () => {
    cancelPlayback();
    finalize();
  }, [cancelPlayback, finalize]);

  // Each note is scheduled independently so leaving the mode cancels pending notes.
  const playSequence = useCallback((midis: number[], phrase?: EarPhrase, measure = false) => {
    if (busy.current) return;
    cancelPlayback();
    busy.current = true;
    setPlaying(true);
    if (measure) {
      listens.current += 1;
      setPlayCount(listens.current);
    }
    let offset = 0;
    if (phrase) {
      const tonic = 48 + phrase.key.root;
      playChord([tonic, tonic + (phrase.key.mode === 'minor' ? 3 : 4), tonic + 7]);
      timers.current.push(setTimeout(() => playMidi(tonic), 1600));
      offset = 2400;
    }
    midis.forEach((midi, index) => {
      timers.current.push(setTimeout(() => playMidi(midi, 0, 0.45), offset + index * NOTE_STEP_MS));
    });
    timers.current.push(setTimeout(() => {
      busy.current = false;
      setPlaying(false);
      if (measure && shownAt.current === 0) shownAt.current = Date.now();
    }, offset + midis.length * NOTE_STEP_MS));
  }, [cancelPlayback]);

  const present = useCallback((next: EarPhrase | null) => {
    cancelPlayback();
    setPlaying(false);
    setQuestion(next);
    entered.current = [];
    setAnswer([]);
    judged.current = false;
    setCorrect(null);
    setHintLevel(0);
    listens.current = 0;
    setPlayCount(0);
    shownAt.current = 0;
    setNotice(next ? null : t('この範囲では出題できません。弦・フレット・音名の範囲を広げてください。'));
    if (next) playSequence(next.midis, next, true);
  }, [cancelPlayback, playSequence]);

  const nextQuestion = useCallback(() => {
    present(generateEarPhrase({ level, range }));
  }, [level, range, present]);

  const start = () => {
    setResult(null);
    startSession('free');
    setStarted(true);
    nextQuestion();
  };

  const stop = () => {
    cancelPlayback();
    setPlaying(false);
    const prev = getLastSession('ear');
    const summary = finalize();
    setStarted(false);
    setQuestion(null);
    setNotice(null);
    setResult(summary ? { summary, prev } : null);
  };

  const judge = useCallback((submitted: number[]) => {
    if (!question || judged.current || submitted.length !== question.midis.length) return;
    judged.current = true;
    const ok = judgeEarPhrase(question.midis, submitted, allowOctave);
    const detail: PhraseSkillAttempt = {
      level, hintLevel, playCount: listens.current, key: question.key,
      midis: question.midis, answer: submitted,
      responseTimeMs: Math.max(0, Date.now() - shownAt.current), allowOctave,
    };
    const input: AttemptInput & { phrase: PhraseSkillAttempt } = {
      quizType: 'ear', isCorrect: ok, responseTimeMs: detail.responseTimeMs,
      string: question.positions[0].string, fret: question.positions[0].fret, phrase: detail,
    };
    record(input);
    recordSkill('ear-phrase', ok, detail);
    setCorrect(ok);
  }, [question, allowOctave, level, hintLevel, record]);

  const tap = (string: number, fret: number) => {
    if (!question || judged.current || busy.current) return;
    const midi = getMidiAt(string, fret);
    playMidi(midi);
    const updated = [...entered.current, midi];
    entered.current = updated;
    setAnswer(updated);
    if (updated.length === question.midis.length) judge(updated);
  };

  const undo = useCallback(() => {
    if (judged.current || busy.current) return;
    entered.current = entered.current.slice(0, -1);
    setAnswer(entered.current);
  }, []);

  useEffect(() => {
    if (!started || !question) return;
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey ||
          (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))) return;
      if (![' ', 'Backspace', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat || busy.current) return;
      if (event.key === ' ') playSequence(question.midis, question, true);
      else if (event.key === 'Backspace') undo();
      else if (judged.current) nextQuestion();
      else judge(entered.current);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, question, playSequence, undo, nextQuestion, judge]);

  const scalePositions = question && hintLevel >= 2 ? getPhraseScalePositions(question.key, range) : [];
  const nextMidi = question?.midis[answer.length];
  const shownMidi = question && correct === null
    ? (hintLevel === 3 ? nextMidi : PHRASE_LEVELS[level].showFirst && answer.length === 0 ? question.midis[0] : undefined)
    : undefined;
  const midiLabel = (midi: number) => noteNames[midi % 12] + (Math.floor(midi / 12) - 1);
  const changeLevel = (value: PhraseLevel) => {
    setLevel(value);
    setAllowOctave(PHRASE_LEVELS[value].allowOctave);
  };
  const transpose = () => {
    if (!question) return;
    const next = transposeEarPhrase(question, range);
    if (next) present(next);
    else setNotice(t('この範囲では別のキーに移せません。終了して範囲を広げてください。'));
  };

  if (result) return (
    <ResultScreen summary={result.summary} prev={result.prev} accidental={accidental}
      showDrill={false} onRestart={start} onClose={() => setResult(null)} />
  );

  return (
    <section className="space-y-6" aria-label={t('フレーズ再現')}>
      <p className="text-sm text-dim text-center text-pretty">
        {t('キーを聴いて、短いフレーズを指板で再現しよう。')}
      </p>
      <fieldset disabled={started && question !== null} className="space-y-3">
        <legend className="text-sm text-dim mb-2">{t('出題設定')}</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {([1, 2, 3, 4] as PhraseLevel[]).map((value) => (
            <button key={value} aria-pressed={level === value} onClick={() => changeLevel(value)}
              className={BUTTON + (level === value ? ' bg-accent-soft text-accent border-accent' : '')}>
              {t('レベル {0}', value)}
            </button>
          ))}
        </div>
        <p className="text-xs text-dim text-center font-mono tabular-nums">
          {t('{0}・{1}', noteCountLabel(PHRASE_LEVELS[level].minNotes, PHRASE_LEVELS[level].maxNotes), motionLabel(PHRASE_LEVELS[level].maxScaleStep))}
        </p>
        <PracticeRangeSelector selectedStrings={selectedStrings} fretRange={range.fretRange}
          maxFret={limit} accidental={accidental} selectedNotes={selectedNotes}
          onStringsChange={setStrings} onFretRangeChange={setRange} onNotesChange={setNotes} />
      </fieldset>
      <label className="flex items-center justify-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={allowOctave} disabled={correct !== null || playing}
          onChange={(event) => setAllowOctave(event.target.checked)} />
        {t('オクターブ違いも正解')}
      </label>
      {notice && <p role="alert" className="text-sm text-accent text-center text-pretty">{notice}</p>}
      {started && !question && <button className={BUTTON} onClick={nextQuestion}>{t('この範囲で再出題')}</button>}
      {started && question && (
        <>
          <QuizScore correct={sessionCorrect} total={count} />
          <div className="text-center space-y-3">
            <p className="font-mono tabular-nums text-ink">
              {t('キー: {0} {1}', noteNames[question.key.root], t(question.key.mode === 'minor' ? 'マイナー' : 'メジャー'))}
            </p>
            <button disabled={playing} onClick={() => playSequence(question.midis, question, true)}
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-accent text-bg font-semibold disabled:opacity-50">
              {t('▶ フレーズを聴く')}
            </button>
            <p role="status" aria-live="polite" className="text-sm text-dim font-mono tabular-nums">
              {playing ? t('再生中…') : t('{0}/{1}音入力・再生{2}回', answer.length, question.midis.length, playCount)}
            </p>
            <p className="text-xs text-dim">{t('Space: 再生 / Backspace: 1音取り消し / Enter: 判定・次へ')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button className={BUTTON} disabled={!answer.length || correct !== null || playing} onClick={undo}>{t('1音取り消す')}</button>
              <button className={BUTTON} disabled={hintLevel === 3 || correct !== null || playing}
                onClick={() => setHintLevel((value) => Math.min(3, value + 1) as 0 | 1 | 2 | 3)}>
                {t('ヒント {0}/3', hintLevel)}
              </button>
            </div>
            {hintLevel >= 1 && (
              <p className="font-mono text-accent" aria-label={t('音の動き')}>
                {getPhraseMotion(question.midis).map((motion) => MOTION[motion]).join(' ')}
              </p>
            )}
            {shownMidi !== undefined && <p className="text-sm text-accent font-mono">{t('次の音: {0}', midiLabel(shownMidi))}</p>}
            <p className="font-mono text-ink tabular-nums" aria-label={t('入力した音')}>
              {answer.map(midiLabel).join(' – ') || '—'}
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-hair bg-surface p-3"
            role="group" aria-label={t('ギター指板（弦とフレットを選んで解答）')}>
            <div className="inline-flex min-w-full flex-col gap-2">
              <div className="flex gap-2 font-mono text-xs text-dim tabular-nums" aria-hidden="true">
                <span className="w-12 shrink-0" />
                {Array.from({ length: range.fretRange[1] - range.fretRange[0] + 1 }, (_, index) => (
                  <span key={index} className="w-12 shrink-0 text-center">{index + range.fretRange[0]}</span>
                ))}
              </div>
              {[...range.strings].sort((a, b) => b - a).map((string) => (
                <div key={string} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-xs text-dim font-mono">{t('{0}弦', 6 - string)}</span>
                  {Array.from({ length: range.fretRange[1] - range.fretRange[0] + 1 }, (_, index) => {
                    const fret = index + range.fretRange[0];
                    const midi = getMidiAt(string, fret);
                    const allowed = !range.notes || range.notes.includes(midi % 12);
                    const scale = scalePositions.some((position) => position.string === string && position.fret === fret);
                    const shown = midi === shownMidi;
                    return (
                      <button key={fret} disabled={!allowed || playing || correct !== null}
                        aria-label={t('{0}弦 {1}フレット', 6 - string, fret)}
                        onClick={() => tap(string, fret)}
                        className={'size-12 shrink-0 rounded border font-mono text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' +
                          (shown ? 'bg-accent-soft border-accent text-accent' : scale ? 'bg-panel border-hair text-dim' : 'bg-bg border-hair text-ink') +
                          (!allowed ? ' opacity-40' : '')}>
                        {shown || scale ? midiLabel(midi) : '·'}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {correct !== null && (
            <div className="space-y-3 rounded-lg border border-hair bg-surface p-4 text-center" aria-live="polite">
              <p className={'font-semibold ' + (correct ? 'text-correct' : 'text-wrong')}>{t(correct ? '正解!' : '不正解...')}</p>
              {hintLevel > 0 && <p className="text-xs text-dim">{t('ヒント使用として記録しました。')}</p>}
              <p className="font-mono text-ink">{t('正解の音: {0}', question.midis.map(midiLabel).join(' – '))}</p>
              <p className="font-mono text-dim">{t('度数: {0}', getPhraseDegreeLabels(question).join(' – '))}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button className={BUTTON} disabled={playing} onClick={() => playSequence(question.midis)}>{t('▶ 正解を聴く')}</button>
                <button className={BUTTON} disabled={playing} onClick={() => playSequence(answer)}>{t('▶ 自分の回答を聴く')}</button>
                <button className={BUTTON} disabled={playing} onClick={nextQuestion}>{t('次の問題')}</button>
                {correct && <button className={BUTTON} disabled={playing} onClick={transpose}>{t('同じ度数で別のキーへ')}</button>}
              </div>
            </div>
          )}
        </>
      )}
      <QuizFooter started={started} onStart={start} onStop={stop} onLearn={onLearn} />
    </section>
  );
}
