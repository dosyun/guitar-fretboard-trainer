import { useEffect, useRef, useState } from 'react';
import { Segmented } from 'antd';
import { Fretboard } from '../Fretboard';
import { COURSE_DAYS, formNotes, generateQuestions, judgeCourseAnswer,
  type CourseDay, type CourseForm, type CourseQuestion } from '../../data/course';
import { BPM_STEPS, completeDay, gapForDay, getNextDay, loadCourse, nextBpm, startDay, updateDay,
  type CourseBpm } from '../../data/courseStore';
import { formMidis, retryQuestions, switchesForDay, type CourseSwitch } from '../../data/courseSession';
import { getCourseMisses, newId, recordAttempt } from '../../data/practiceStore';
import { isSoundEnabled, playChord, setSoundEnabled } from '../../data/audio';
import { track } from '../../data/analytics';
import { useBeatPlayer } from '../../hooks/useBeatPlayer';
import type { FretPosition } from '../../types';

const primary = 'min-h-12 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg';
const secondary = 'min-h-12 rounded-lg border border-hair bg-panel px-4 py-3 text-sm text-ink';
const textButton = 'min-h-12 text-sm text-dim underline hover:text-ink';
const positionNames = { low: '低い形', mid: '中ほどの形', high: '高い形', top: '上の形' };
const stepNames = ['確認', '隠して探す', '伴奏で切り替え', 'もう一度', '自分の曲に当てる'];

function FormBoard({ form, next, onPlay }: { form: CourseForm; next?: CourseForm; onPlay?: () => void }) {
  const notes = formNotes(form);
  const nextNotes = next ? formNotes(next) : [];
  const shared = notes.filter((note) => nextNotes.some((other) => other.string === note.string && other.fret === note.fret));
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg bg-glass p-2">
      <Fretboard maxFret={Math.max(12, ...form.frets, ...(next?.frets ?? []))} accidental="sharp"
        highlightPosition={null} feedback={null}
        focusFret={Math.round((Math.min(...form.frets) + Math.max(...form.frets)) / 2)}
        correctPositions={notes} accentPositions={shared}
        showLabelAt={(string, fret) => notes.find((note) => note.string === string && note.fret === fret)?.degree}
        ghostLabels={nextNotes.filter((note) => !notes.some((current) => current.string === note.string && current.fret === note.fret))
          .map((note) => ({ position: note, label: note.degree }))}
        playOnClick={false} onPositionClick={onPlay ? () => onPlay() : undefined} />
    </div>
  );
}

function CourseRound({ questions, onComplete }: {
  questions: CourseQuestion[];
  onComplete: (correct: number, wrong: CourseQuestion[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<{ position: FretPosition; correct: boolean } | null>(null);
  const [sessionId] = useState(newId);
  const started = useRef(0);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correct = useRef(0);
  const wrong = useRef<CourseQuestion[]>([]);
  useEffect(() => {
    started.current = performance.now();
    return () => { if (timer.current !== null) clearTimeout(timer.current); };
  }, []);
  const question = questions[index];
  const form = COURSE_DAYS.flatMap((day) => day.forms).find((item) => item.chord === question.chord
    && item.pos === question.pos && formNotes(item).every((note) => question.strings.includes(note.string))
    && Math.min(...item.frets) === question.fretRange[0]);
  const revealed = answer && form ? formNotes(form) : [];
  function respond(position: FretPosition) {
    if (busy.current) return;
    busy.current = true;
    const ok = judgeCourseAnswer(question, position);
    recordAttempt({
      id: newId(), sessionId, createdAt: Date.now(), quizType: 'course-triad',
      isCorrect: ok, responseTimeMs: Math.max(0, performance.now() - started.current),
      string: position.string, fret: position.fret, rootNote: question.root,
      degree: question.interval, courseKey: question.courseKey,
    });
    if (ok) correct.current += 1;
    else wrong.current.push(question);
    setAnswer({ position, correct: ok });
    timer.current = setTimeout(() => {
      if (index + 1 === questions.length) onComplete(correct.current, wrong.current);
      else {
        started.current = performance.now();
        busy.current = false;
        setAnswer(null);
        setIndex(index + 1);
      }
    }, 1000);
  }
  return (
    <>
      <p className="font-mono text-3xl text-accent">{index + 1}/{questions.length}</p>
      <p className="text-base text-ink">{`${Math.min(...question.strings.map((s) => 6 - s))}〜${Math.max(...question.strings.map((s) => 6 - s))}弦・${question.fretRange[0]}〜${question.fretRange[1]}フレットで ${question.chord} の ${question.degree} を探す`}</p>
      <div role="status" aria-live="polite" className="min-h-12 text-sm">
        {answer && <p className={answer.correct ? 'text-correct' : 'text-wrong'}>{answer.correct ? '正解!' : '正解の形を確認してください。'}</p>}
      </div>
      <div className="min-w-0 overflow-x-auto rounded-lg bg-glass p-2">
        <Fretboard maxFret={Math.max(12, question.fretRange[1])} accidental="sharp"
          focusFret={Math.round((question.fretRange[0] + question.fretRange[1]) / 2)}
          highlightPosition={answer?.position ?? null} feedback={answer ? answer.correct ? 'correct' : 'wrong' : null}
          correctPositions={answer ? revealed : undefined}
          showLabelAt={answer ? (string, fret) => revealed.find((note) => note.string === string && note.fret === fret)?.degree : undefined}
          onPositionClick={answer ? undefined : respond} />
      </div>
    </>
  );
}

function Accompaniment({ forms, bpm, onBpmChange, onComplete }: {
  forms: CourseForm[]; bpm: CourseBpm;
  onBpmChange?: (bpm: CourseBpm) => void;
  onComplete: (playedToEnd: boolean) => void;
}) {
  const [sound, setSound] = useState(isSoundEnabled);
  useEffect(() => {
    const syncSound = () => setSound(isSoundEnabled());
    window.addEventListener('gft-sound-change', syncSound);
    return () => window.removeEventListener('gft-sound-change', syncSound);
  }, []);
  const player = useBeatPlayer({
    progression: forms.map((form, index) => ({ id: String(index), midis: formMidis(form) })),
    bpm, soundEnabled: sound,
  });
  const current = player.currentChord === null ? undefined : forms[Number(player.currentChord)];
  const next = player.nextChord === null ? undefined : forms[Number(player.nextChord)];
  return (
    <div className="min-w-0 space-y-4">
      {!sound || !isSoundEnabled() ? (
        <>
          <p className="rounded-lg bg-glass p-3 text-sm text-ink" role="status">音が OFF です。伴奏を聴くには音を ON にしてください。</p>
          <button type="button" className={primary} onClick={() => { setSoundEnabled(true); setSound(true); }}>音を ON にする</button>
        </>
      ) : (
        <>
          <p className="text-sm text-dim">1小節のカウントの後、2小節ごとに形を切り替えます。ギターで合わせて弾いてください。</p>
          {onBpmChange
            ? <Segmented aria-label="BPM" options={[...BPM_STEPS]} value={bpm} onChange={(value) => onBpmChange(value as CourseBpm)} />
            : <p className="font-mono text-sm text-ink">BPM {bpm}</p>}
          <div className="rounded-lg bg-glass p-3 font-mono text-3xl text-accent" role="status" aria-live="polite">
            {player.isCountIn ? `カウント ${player.beatInBar}` : `${current?.chord ?? '—'} / ${next?.chord ?? '—'}`}
          </div>
          <p className="text-sm text-dim">現在の形 / 次の形</p>
          <FormBoard form={current ?? forms[0]} next={next} />
          {player.isPlaying
            ? <button type="button" className={secondary} onClick={player.stop}>停止</button>
            : <button type="button" className={player.hasFinished ? secondary : primary} onClick={player.start}>伴奏を再生</button>}
          {player.unavailable && <p role="status" className="text-sm text-dim">音が出せない環境です</p>}
          {player.failed && <p role="status" className="text-sm text-dim">音を再生できませんでした</p>}
        </>
      )}
      {(player.hasStarted || player.unavailable || player.failed) && (
        <button type="button" className={primary} onClick={() => {
          player.stop();
          onComplete(player.hasFinished);
        }}>演奏を終えた</button>
      )}
    </div>
  );
}

function SwitchStep({ course, bpm, onBpmChange, onComplete }: {
  course: CourseDay; bpm: CourseBpm; onBpmChange: (bpm: CourseBpm) => void;
  onComplete: (ok: boolean, stalls: string[]) => void;
}) {
  const [pos, setPos] = useState(course.forms[0].pos);
  const [finished, setFinished] = useState(false);
  const [stalled, setStalled] = useState(false);
  const choices = switchesForDay(course).filter((item) => item.from.pos === pos);
  const [selected, setSelected] = useState('');
  const forms = course.progression.map((chord) => course.forms.find((form) => form.chord === chord && form.pos === pos)!);
  if (finished) return (
    <div className="space-y-4">
      <p className="text-base text-ink">止まらず弾けましたか？</p>
      <Segmented options={[{ label: '止まらず弾けた', value: 0 }, { label: '途中で止まった', value: 1 }]}
        value={Number(stalled)} onChange={(value) => setStalled(Boolean(value))}
      />
      {stalled && (
        <label className="block text-sm text-ink">
          止まった切り替え
          <select className="mt-2 block min-h-12 w-full rounded-lg border border-hair bg-panel p-3 text-ink"
            value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">切り替えを選んでください</option>
            {choices.map((item) => <option key={item.id} value={item.id}>{item.from.chord} → {item.to.chord} / {positionNames[pos]}</option>)}
          </select>
        </label>
      )}
      <button type="button" className={primary} disabled={stalled && !selected}
        onClick={() => onComplete(!stalled, stalled ? [selected] : [])}>もう一度へ</button>
    </div>
  );
  return (
    <>
      <Segmented aria-label="形の位置" options={[...new Set(course.forms.map((form) => form.pos))].map((value) => ({ value, label: positionNames[value] }))}
        value={pos} onChange={(value) => setPos(value)} />
      <Accompaniment key={`${pos}:${bpm}`} forms={forms} bpm={bpm} onBpmChange={onBpmChange} onComplete={(playedToEnd) => {
        setStalled(!playedToEnd);
        setFinished(true);
      }} />
    </>
  );
}

function RetryStep({ questions, stalls, bpm, onComplete }: {
  questions: CourseQuestion[]; stalls: CourseSwitch[]; bpm: CourseBpm; onComplete: () => void;
}) {
  const [answered, setAnswered] = useState(questions.length === 0);
  const [replayed, setReplayed] = useState(0);
  if (!answered) return <CourseRound questions={questions} onComplete={() => setAnswered(true)} />;
  const stalled = stalls[replayed];
  if (stalled) return (
    <>
      <p className="text-sm text-ink">止まった2つの形だけを、BPM を1段下げてもう一度弾きます。</p>
      <Accompaniment key={`${stalled.id}:${bpm}`} forms={[stalled.from, stalled.to]} bpm={BPM_STEPS[Math.max(0, BPM_STEPS.indexOf(bpm) - 1)]}
        onComplete={() => setReplayed((value) => value + 1)} />
    </>
  );
  return (
    <>
      <p className="text-base text-ink">{questions.length === 0 && stalls.length === 0 ? '復習する誤答や切り替えはありません。' : 'もう一度の練習を終えました。'}</p>
      <button type="button" className={primary} onClick={onComplete}>この回を完了</button>
    </>
  );
}

function CourseDayScreen({ course, onBack, onLearn }: {
  course: CourseDay; onBack: () => void; onLearn: (id: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [questions] = useState(() => generateQuestions(course.day));
  const [history] = useState(() => getCourseMisses(2000));
  const [wrong, setWrong] = useState<CourseQuestion[]>([]);
  const [bpm, setBpm] = useState(() => nextBpm(loadCourse(), course.day));
  const [stalls, setStalls] = useState<string[]>([]);
  const started = useRef(false);
  const looperTracked = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const store = loadCourse();
    track('course_day_start', { course_day: course.day, is_repeat: store.days[course.day] !== undefined,
      gap: gapForDay(course.day, store, Date.now()) });
    startDay(course.day);
  }, [course.day]);
  function finishStep(name: string, result = 'done', switchBpm?: CourseBpm) {
    track('course_step_complete', { course_day: course.day, course_step: name, result,
      ...(switchBpm === undefined ? {} : { bpm: switchBpm }) });
    setStep((value) => value + 1);
  }
  const retry = retryQuestions(wrong, history);
  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{`第${course.day}回`}</h1>
          <p className="mt-2 text-sm text-dim">{course.topic}</p>
        </div>
        <button type="button" className={textButton} onClick={onBack}>コース一覧へ</button>
      </header>
      {step === 0 && <div className="flex flex-wrap gap-4 text-sm">
        <button type="button" className={textButton} onClick={() => onLearn('degree')}>度数（インターバル）</button>
        <button type="button" className={textButton} onClick={() => onLearn('triad')}>トライアド（3和音）</button>
      </div>}
      <div className="h-1 bg-glass" role="progressbar" aria-label="コースの進捗" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.min(step, 4)}>
        <div className={`h-1 ${step === 4 ? 'bg-correct' : 'bg-dim'}`} style={{ width: `${Math.min(step, 4) * 25}%` }} />
      </div>
      <div className="min-w-0 space-y-4 rounded-2xl border border-hair border-t-case-edge bg-surface p-3 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">{step + 1}/5 {stepNames[step]}</h2>
        {step === 0 && (
          <>
            <p className="text-base text-ink">{course.noticing}</p>
            <p className="text-sm text-dim">形をタップすると和音が鳴ります。琥珀の印は次のコードと同じ位置の音です。</p>
            {course.forms.filter((form, index, all) => all.findIndex((item) => item.id === form.id) === index).map((form) => (
              <div key={form.id} className="min-w-0 space-y-2">
                <p className="text-sm text-ink">{form.chord} / {positionNames[form.pos]}</p>
                <FormBoard form={form} next={switchesForDay(course).find((item) => item.from.id === form.id)?.to}
                  onPlay={() => playChord(formMidis(form))} />
              </div>
            ))}
            <button type="button" className={primary} onClick={() => finishStep('confirm')}>見た</button>
          </>
        )}
        {step === 1 && <CourseRound questions={questions} onComplete={(correct, mistakes) => {
          setWrong(mistakes);
          updateDay(course.day, { hidden: { correct, total: 10 } });
          finishStep('hidden', correct <= 4 ? '0-4' : correct <= 7 ? '5-7' : '8-10');
        }} />}
        {step === 2 && <SwitchStep course={course} bpm={bpm} onBpmChange={setBpm} onComplete={(ok, selected) => {
          setStalls(selected);
          updateDay(course.day, { switchBpm: bpm, switchOk: ok, stalls: selected });
          finishStep('switch', ok ? 'ok' : 'stalled', bpm);
        }} />}
        {step === 3 && <RetryStep questions={retry} stalls={switchesForDay(course).filter((item) => stalls.includes(item.id))} bpm={bpm}
          onComplete={() => {
            const store = completeDay(course.day);
            finishStep('retry');
            track('course_day_complete', { course_day: course.day,
              days_completed: Object.values(store.days).filter((day) => day.completedAt !== undefined).length });
          }} />}
        {step === 4 && (
          <>
            <p className="text-base text-ink">この回を完了しました。</p>
            <p className="text-sm text-dim">好きな曲の伴奏を、ループ練習で A-B ループして、今日の形で合わせます。この練習は任意です。</p>
            <a className={`inline-flex items-center ${primary}`} href={`/looper/?from=course&day=${course.day}`} target="_blank" rel="noopener noreferrer"
              onClick={() => {
                updateDay(course.day, { looperClicked: true });
                track('course_to_looper', { course_day: course.day });
                if (!looperTracked.current) {
                  looperTracked.current = true;
                  track('course_step_complete', { course_day: course.day, course_step: 'looper', result: 'opened' });
                }
              }}>ループ練習を開く</a>
            <button type="button" className={secondary} onClick={onBack}>コース一覧へ</button>
          </>
        )}
      </div>
    </section>
  );
}

interface PracticeCourseProps {
  initialDay?: number;
  entry: 'direct' | 'home_card' | 'lesson' | 'hub';
  onDayChange: (day: number | undefined) => void;
  onLearn: (lessonId: string) => void;
  onExit: () => void;
}

export function PracticeCourse({ initialDay, entry, onDayChange, onLearn, onExit }: PracticeCourseProps) {
  const [day, setDay] = useState(() => COURSE_DAYS.some((item) => item.day === initialDay) ? initialDay : undefined);
  const viewed = useRef(false);
  useEffect(() => {
    if (!viewed.current) {
      viewed.current = true;
      track('course_view', { entry });
    }
  }, [entry]);
  function openDay(value: number | undefined) {
    setDay(value);
    onDayChange(value);
  }
  const course = COURSE_DAYS.find((item) => item.day === day);
  if (course) return <CourseDayScreen key={course.day} course={course} onBack={() => openDay(undefined)} onLearn={onLearn} />;
  const store = loadCourse();
  const next = getNextDay(store);
  return (
    <section className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">トライアド練習コース</h1>
        <button type="button" className={textButton} onClick={onExit}>ホームへ戻る</button>
      </header>
      <div className="space-y-4 rounded-2xl border border-hair border-t-case-edge bg-surface p-3 sm:p-6">
        <p className="text-base text-ink">1回約15分。確認、隠して探す、伴奏、もう一度の順に練習します。どの回からでも始められます。</p>
        <button type="button" className={primary} onClick={() => openDay(next)}>{`次は第${next}回`}</button>
        <ul className="divide-y divide-hair border-t border-hair">
          {COURSE_DAYS.map((item) => (
            <li key={item.day}>
              <button type="button" className="flex min-h-12 w-full flex-wrap items-center justify-between gap-3 py-4 text-left text-sm text-ink"
                aria-current={item.day === next ? 'step' : undefined} onClick={() => openDay(item.day)}>
                <span>{`第${item.day}回`} {item.topic}</span>
                <span className={store.days[item.day]?.completedAt !== undefined ? 'text-correct' : 'text-dim'}>
                  {store.days[item.day]?.completedAt !== undefined ? '完了' : item.day === next ? '次はここ' : '始める'} →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
