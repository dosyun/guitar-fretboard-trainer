import { useState } from 'react';
import { LESSONS, LESSON_CHAPTERS } from '../data/lessons';
import type { LessonCheckQ } from '../data/lessons';
import { getCompletedLessons, markLessonComplete } from '../data/lessonProgress';
import { LessonFretboard } from './LessonFretboard';

interface LessonsPageProps {
  onGoto: (target: string) => void;
}

/** 理解度チェック（学んだ直後にその場で確かめる）。多肢選択。 */
function LessonCheck({ check }: { check: LessonCheckQ[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  return (
    <div className="space-y-3 border-t border-hair pt-4">
      <h3 className="text-sm font-medium text-ink">理解度チェック</h3>
      {check.map((q, qi) => {
        const sel = answers[qi];
        const answered = sel !== undefined;
        return (
          <div key={qi} className="space-y-1.5">
            <p className="text-sm text-ink text-pretty">{q.q}</p>
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono border transition-colors ${cls}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {answered && q.why && <p className="text-xs text-dim text-pretty">{q.why}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function LessonsPage({ onGoto }: LessonsPageProps) {
  const [idx, setIdx] = useState<number | null>(null);
  const completed = getCompletedLessons();

  // ===== 一覧（章ごと・進捗付き） =====
  if (idx === null) {
    const done = completed.size;
    return (
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
            LEARN
          </div>
          <span className="text-xs text-dim">
            <span className="font-mono tabular-nums text-ink">{done}</span>/{LESSONS.length} 完了
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-panel overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round((done / LESSONS.length) * 100)}%`, background: 'var(--correct)' }}
          />
        </div>
        <p className="text-sm text-dim text-pretty">
          ゼロから順に。各レッスンは1分ほど。読んで・指板で見て・確かめてから練習へ。
        </p>

        {LESSON_CHAPTERS.map((ch) => (
          <div key={ch} className="space-y-2">
            <h3 className="text-xs font-mono text-dim tracking-wide">{ch}</h3>
            <ul className="space-y-2">
              {LESSONS.map((l, i) => ({ l, i }))
                .filter((x) => x.l.chapter === ch)
                .map(({ l, i }) => (
                  <li key={l.id}>
                    <button
                      onClick={() => setIdx(i)}
                      className="w-full text-left bg-surface border border-hair rounded-xl px-4 py-3 hover:bg-panel transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {completed.has(l.id) ? (
                          <span className="text-correct font-bold">✓</span>
                        ) : (
                          <span className="font-mono text-dim">{i + 1}</span>
                        )}
                        <span className="text-ink font-medium">{l.title}</span>
                      </div>
                      <p className="text-xs text-dim mt-1 line-clamp-1">{l.body[0]}</p>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // ===== レッスン本体 =====
  const l = LESSONS[idx];
  const isDone = completed.has(l.id);
  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button onClick={() => setIdx(null)} className="text-sm text-dim hover:text-ink transition-colors">
        ← レッスン一覧へ
      </button>

      <div className="bg-surface border border-hair rounded-2xl p-6 space-y-4">
        <div>
          <div className="font-mono text-xs text-dim flex items-center gap-2">
            <span>LESSON {idx + 1} / {LESSONS.length}</span>
            {isDone && <span className="text-correct">✓ 学習済み</span>}
          </div>
          <h2 className="text-xl font-bold text-ink text-balance mt-1">{l.title}</h2>
        </div>

        <div className="space-y-2 text-sm text-ink leading-relaxed text-pretty">
          {l.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {l.example && (
          <div className="bg-panel border border-hair rounded-lg px-3 py-2 font-mono text-sm text-ink overflow-x-auto">
            {l.example}
          </div>
        )}

        {l.demo && (
          <div className="bg-bg border border-hair rounded-lg p-2 overflow-x-auto">
            <LessonFretboard root={l.demo.root} tones={l.demo.tones} maxFret={l.demo.maxFret} />
          </div>
        )}

        {l.check && <LessonCheck key={idx} check={l.check} />}

        {l.link && (
          <button
            onClick={() => onGoto(l.link!.target)}
            className="w-full px-4 py-3 bg-panel text-ink border border-hair rounded-lg hover:bg-accent-soft transition-colors"
          >
            {l.link.label} →
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          className="px-5 py-2 bg-panel text-dim border border-hair rounded-lg disabled:opacity-40 hover:bg-accent-soft transition-colors"
        >
          ← 前
        </button>
        <button
          onClick={() => {
            markLessonComplete(l.id);
            setIdx(idx < LESSONS.length - 1 ? idx + 1 : null);
          }}
          className="flex-1 px-4 py-2 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
        >
          {idx < LESSONS.length - 1 ? '学んだ → 次へ' : '学んだ → 完了'}
        </button>
      </div>
    </div>
  );
}
