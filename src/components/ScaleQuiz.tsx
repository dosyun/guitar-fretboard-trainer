import { Fretboard } from './Fretboard';
import { ScoreBoard } from './ScoreBoard';
import { FootSwitch } from './FootSwitch';
import { SCALE_COLORS } from '../data/scales';
import type { ScaleName } from '../data/scales';
import type { ScaleQuizMode } from '../hooks/useScaleQuiz';
import type { NoteName, Accidental, FretPosition, ScoreState, Feedback } from '../types';

interface ScaleQuizProps {
  quiz: {
    mode: ScaleQuizMode;
    currentPosition: FretPosition | null;
    currentDegree: string | null;
    feedback: Feedback;
    correctAnswer: string | null;
  };
  started: boolean;
  score: ScoreState;
  scaleName: ScaleName;
  rootNote: NoteName;
  accidental: Accidental;
  maxFret: number;
  degreeLabels: string[];
  onStart: (mode: ScaleQuizMode) => void;
  onSetMode: (mode: ScaleQuizMode) => void;
  onAnswerInOrOut: (answer: 'in' | 'out') => void;
  onAnswerDegree: (degree: string) => void;
}

export function ScaleQuiz({
  quiz, started, score, scaleName, rootNote, accidental, maxFret, degreeLabels,
  onStart, onSetMode, onAnswerInOrOut, onAnswerDegree,
}: ScaleQuizProps) {
  const color = SCALE_COLORS[scaleName];

  const getPrompt = () => {
    if (!started || !quiz.currentPosition) return null;
    const pos = quiz.currentPosition;
    const posLabel = `${6 - pos.string}弦 ${pos.fret}フレット`;
    if (quiz.mode === 'in-or-out') {
      return `${posLabel} はスケール内？外？ (Key: ${rootNote})`;
    }
    return `${posLabel} のスケール度数は？ (Key: ${rootNote})`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* モード選択 */}
      <div className="flex gap-1 bg-panel p-1 rounded-lg max-w-sm mx-auto">
        {([
          ['in-or-out', 'スケール内/外'],
          ['identify-degree', '度数当て'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onSetMode(value)}
            className={`flex-1 min-h-12 px-3 rounded-lg border text-sm font-semibold transition-colors ${
              quiz.mode === value ? 'bg-accent-soft text-accent border-accent' : 'text-dim border-transparent hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {started && <ScoreBoard score={score} />}

      {started && (
        <div className="text-center">
          <p className="text-ink font-semibold">{getPrompt()}</p>
          {quiz.feedback && (
            <p className={`text-xl font-semibold mt-1 ${
              quiz.feedback === 'correct' ? 'text-correct' : 'text-wrong'
            }`}>
              {quiz.feedback === 'correct' ? '正解!' : `不正解... ${quiz.correctAnswer ? `正解: ${quiz.correctAnswer}` : ''}`}
            </p>
          )}
        </div>
      )}

      {started && (
        <div className="overflow-x-auto">
          <Fretboard
            maxFret={maxFret}
            accidental={accidental}
            highlightPosition={quiz.currentPosition}
            feedback={quiz.feedback}
            showLabelAt={() => undefined}
          />
        </div>
      )}

      {/* 回答ボタン: in-or-out */}
      {started && quiz.mode === 'in-or-out' && (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onAnswerInOrOut('in')}
            disabled={quiz.feedback !== null}
            style={{ background: color.bg, borderColor: color.border }}
            className="min-h-12 px-6 py-3 rounded-lg text-base font-semibold text-ink border-2
                       hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            スケール内
          </button>
          <button
            onClick={() => onAnswerInOrOut('out')}
            disabled={quiz.feedback !== null}
            className="min-h-12 px-6 py-3 rounded-lg text-base font-semibold text-ink bg-panel border border-hair
                       hover:border-dim disabled:opacity-50 disabled:cursor-not-allowed"
          >
            スケール外
          </button>
        </div>
      )}

      {/* 回答ボタン: identify-degree */}
      {started && quiz.mode === 'identify-degree' && (
        <div className="flex gap-2 justify-center flex-wrap">
          {degreeLabels.map((deg) => {
            const isCorrectHighlight = quiz.feedback === 'wrong' && deg === quiz.correctAnswer;
            return (
              <FootSwitch
                key={deg}
                label={deg}
                lamp={isCorrectHighlight ? 'correct' : 'off'}
                onClick={() => onAnswerDegree(deg)}
                disabled={quiz.feedback !== null}
              />
            );
          })}
        </div>
      )}

      {!started && (
        <button
          onClick={() => onStart(quiz.mode)}
          className="mx-auto min-h-12 px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:opacity-90 transition-opacity"
        >
          スタート
        </button>
      )}
    </div>
  );
}
