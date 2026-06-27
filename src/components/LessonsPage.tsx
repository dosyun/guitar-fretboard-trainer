import { useState } from 'react';
import { LESSONS } from '../data/lessons';
import type { LessonCheckQ } from '../data/lessons';
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

  if (idx === null) {
    return (
      <div className="max-w-2xl mx-auto w-full space-y-3">
        <div className="font-mono text-xs tracking-widest text-accent flex items-center gap-2">
          <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
          LEARN
        </div>
        <p className="text-sm text-dim text-pretty">
          ゼロから順に。各レッスンは1分ほど。読んだら指板で見て、練習で確かめよう。
        </p>
        <ul className="space-y-2">
          {LESSONS.map((l, i) => (
            <li key={l.id}>
              <button
                onClick={() => setIdx(i)}
                className="w-full text-left bg-surface border border-hair rounded-xl px-4 py-3 hover:bg-panel transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-dim">{i + 1}</span>
                  <span className="text-ink font-medium">{l.title}</span>
                </div>
                <p className="text-xs text-dim mt-1 line-clamp-1">{l.body[0]}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const l = LESSONS[idx];
  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      <button onClick={() => setIdx(null)} className="text-sm text-dim hover:text-ink transition-colors">
        ← レッスン一覧へ
      </button>

      <div className="bg-surface border border-hair rounded-2xl p-6 space-y-4">
        <div>
          <div className="font-mono text-xs text-dim">
            LESSON {idx + 1} / {LESSONS.length}
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
            className="w-full px-4 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 active:opacity-80 transition-opacity"
          >
            {l.link.label} →
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          className="flex-1 px-4 py-2 bg-panel text-dim border border-hair rounded-lg disabled:opacity-40 hover:bg-accent-soft transition-colors"
        >
          ← 前
        </button>
        <button
          disabled={idx === LESSONS.length - 1}
          onClick={() => setIdx(idx + 1)}
          className="flex-1 px-4 py-2 bg-panel text-ink border border-hair rounded-lg disabled:opacity-40 hover:bg-accent-soft transition-colors"
        >
          次 →
        </button>
      </div>
    </div>
  );
}
