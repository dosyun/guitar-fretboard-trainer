import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { LESSONS, LESSON_CHAPTERS, CHAPTER_LEVEL } from '../data/lessons';
import type { LessonCheckQ, LessonLevel } from '../data/lessons';
import { getCompletedLessons, markLessonComplete } from '../data/lessonProgress';
import { LessonFretboard } from './LessonFretboard';

interface LessonsPageProps {
  onGoto: (target: string) => void;
  /** Home などから特定レッスンを直接開く（適用後 onConsumeOpen で消費）。 */
  openLessonId?: string;
  onConsumeOpen?: () => void;
}

const LEVEL_STYLE: Record<LessonLevel, string> = {
  初級: 'text-correct',
  中級: 'text-accent',
  上級: 'text-wrong',
};

function LevelBadge({ level }: { level: LessonLevel }) {
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-mono border border-hair bg-panel ${LEVEL_STYLE[level]}`}>
      {t(level)}
    </span>
  );
}

/** 理解度チェック（学んだ直後にその場で確かめる）。多肢選択。 */
function LessonCheck({ check }: { check: LessonCheckQ[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  return (
    <div className="space-y-6 border-t border-hair pt-6">
      <h3 className="text-lg font-semibold text-ink">理解度チェック</h3>
      {check.map((q, qi) => {
        const sel = answers[qi];
        const answered = sel !== undefined;
        return (
          <div key={qi} className="space-y-3">
            <p className="text-sm leading-relaxed text-ink text-pretty">{q.q}</p>
            <div className="flex flex-wrap gap-2">
              {q.choices.map((c, ci) => {
                let cls = 'bg-panel text-ink border-hair hover:bg-accent-soft';
                if (answered) {
                  if (ci === q.answer) cls = 'bg-correct text-bg border-correct';
                  else if (ci === sel) cls = 'bg-wrong text-white border-wrong';
                  else cls = 'bg-panel text-dim border-hair opacity-60';
                }
                return (
                  <button
                    key={ci}
                    disabled={answered}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: ci }))}
                    className={`min-h-12 px-4 py-3 rounded-xl text-sm font-mono border ${cls}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {answered && q.why && <p className="text-sm leading-relaxed text-dim text-pretty">{q.why}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function LessonsPage({ onGoto, openLessonId, onConsumeOpen }: LessonsPageProps) {
  const [idx, setIdx] = useState<number | null>(null);
  const completed = getCompletedLessons();

  // Home の「次のレッスン →」等から特定レッスンを開く
  useEffect(() => {
    if (openLessonId) {
      const i = LESSONS.findIndex((l) => l.id === openLessonId);
      if (i >= 0) setIdx(i);
      onConsumeOpen?.();
    }
    // openLessonId の変化時のみ反応（onConsumeOpen は安定でない可能性があるため除外）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLessonId]);

  // ===== 一覧（章ごと・進捗付き） =====
  if (idx === null) {
    const done = completed.size;
    const allDone = done === LESSONS.length;
    const nextIdx = LESSONS.findIndex((l) => !completed.has(l.id));
    const nextLesson = nextIdx >= 0 ? LESSONS[nextIdx] : null;
    return (
      <div className="mx-auto w-full max-w-5xl min-w-0 space-y-8">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-dim flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
            理論を学ぶ
          </div>
          <span className="text-xs text-dim">
            <span className="font-mono tabular-nums text-ink">{done}</span>/{LESSONS.length} 完了
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">音楽理論のレッスン</h1>
        <div className="h-2 rounded-full bg-panel overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round((done / LESSONS.length) * 100)}%`, background: 'var(--correct)' }}
          />
        </div>

        {allDone ? (
          <div className="bg-accent-soft border border-accent rounded-xl px-4 py-3 text-center">
            <p className="text-accent font-semibold">{`🎉 全${LESSONS.length}レッスン制覇！`}</p>
            <p className="text-xs text-dim mt-1">理論コースを完走しました。練習で実戦に活かそう。</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-dim text-pretty">
            ゼロから順に。各レッスンは1分ほど。読んで・指板で見て・確かめてから練習へ。
          </p>
        )}

        {nextLesson && (
          <button
            onClick={() => setIdx(nextIdx)}
            className="min-h-12 w-full text-left bg-surface border border-hair rounded-2xl p-6 hover:bg-panel"
          >
            <div className="text-xs text-dim">続きから</div>
            <div className="text-lg text-ink font-semibold mt-2">{nextLesson.title} →</div>
          </button>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-2">
          {LESSON_CHAPTERS.map((ch) => {
            const chLessons = LESSONS.map((l, i) => ({ l, i })).filter((x) => x.l.chapter === ch);
            const chDone = chLessons.filter((x) => completed.has(x.l.id)).length;
            const cleared = chDone === chLessons.length;
            return (
              <details key={ch} open={ch === nextLesson?.chapter} className="group min-w-0 border border-hair rounded-2xl bg-surface">
                <summary
                  aria-label={`${ch}（${cleared ? 'クリア済み' : `${chDone}/${chLessons.length}完了`}）章を開閉`}
                  className="min-h-16 cursor-pointer list-none p-4 flex flex-wrap items-center gap-3 text-sm text-dim"
                >
                  <span className="text-ink">{ch}</span>
                  <LevelBadge level={CHAPTER_LEVEL[ch]} />
                  {cleared ? (
                    <span className="text-correct">✓ クリア</span>
                  ) : (
                    <span className="tabular-nums">{chDone}/{chLessons.length}</span>
                  )}
                  <span className="ml-auto group-open:rotate-180">▾</span>
                </summary>
                <ul className="space-y-3 px-4 pb-4">
                  {chLessons.map(({ l, i }) => (
                    <li key={l.id}>
                      <button
                        onClick={() => setIdx(i)}
                        className="min-h-12 w-full text-left bg-panel rounded-xl p-4 hover:bg-accent-soft"
                      >
                        <div className="flex items-center gap-3">
                          {completed.has(l.id) ? (
                            <span className="text-correct font-bold">✓</span>
                          ) : (
                            <span className="font-mono text-dim">{i + 1}</span>
                          )}
                          <span className="text-ink font-medium">{l.title}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-dim mt-2 line-clamp-2">{l.body[0]}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== レッスン本体 =====
  const l = LESSONS[idx];
  const isDone = completed.has(l.id);
  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-8">
      <button onClick={() => setIdx(null)} className="min-h-12 text-sm text-dim hover:text-ink">
        ← レッスン一覧へ
      </button>

      <div className="bg-surface border border-hair rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <div className="font-mono text-xs text-dim flex flex-wrap items-center gap-3">
            <span>LESSON {idx + 1} / {LESSONS.length}</span>
            <LevelBadge level={CHAPTER_LEVEL[l.chapter]} />
            {isDone && <span className="text-correct">✓ 学習済み</span>}
          </div>
          <h2 className="text-2xl font-semibold text-ink text-balance mt-3">{l.title}</h2>
        </div>

        <div className="max-w-3xl space-y-4 text-sm text-ink leading-relaxed text-pretty">
          {l.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {l.example && (
          <div className="bg-panel border border-hair rounded-xl p-4 font-mono text-sm text-ink overflow-x-auto">
            {l.example}
          </div>
        )}

        {l.demo && (
          <div className="bg-bg border border-hair rounded-xl p-4 overflow-x-auto">
            <LessonFretboard root={l.demo.root} tones={l.demo.tones} maxFret={l.demo.maxFret} />
          </div>
        )}

        {l.check && <LessonCheck key={idx} check={l.check} />}

        {l.link && (
          <button
            onClick={() => onGoto(l.link!.target)}
            className="min-h-12 w-full px-4 py-3 bg-panel text-sm text-ink border border-hair rounded-xl hover:bg-accent-soft"
          >
            {l.link.label} →
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <button
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          className="min-h-12 px-6 py-3 bg-panel text-sm text-dim border border-hair rounded-xl disabled:opacity-40 hover:bg-accent-soft"
        >
          ← 前
        </button>
        <button
          onClick={() => {
            markLessonComplete(l.id);
            setIdx(idx < LESSONS.length - 1 ? idx + 1 : null);
          }}
          className="min-h-12 flex-1 px-4 py-3 bg-accent text-sm text-bg font-semibold rounded-xl hover:opacity-90 active:opacity-80"
        >
          {idx < LESSONS.length - 1 ? '学んだ → 次へ' : '学んだ → 完了'}
        </button>
      </div>
    </div>
  );
}
