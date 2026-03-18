import { Fretboard } from './Fretboard';
import { ScoreBoard } from './ScoreBoard';
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
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg max-w-sm mx-auto">
        {([
          ['in-or-out', 'スケール内/外'],
          ['identify-degree', '度数当て'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onSetMode(value)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              quiz.mode === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {started && <ScoreBoard score={score} />}

      {started && (
        <div className="text-center">
          <p className="text-gray-700 font-medium">{getPrompt()}</p>
          {quiz.feedback && (
            <p className={`text-lg font-bold mt-1 ${
              quiz.feedback === 'correct' ? 'text-green-600' : 'text-red-500'
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
            className="px-6 py-3 rounded-lg text-base font-bold text-white border-2
                       hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            スケール内
          </button>
          <button
            onClick={() => onAnswerInOrOut('out')}
            disabled={quiz.feedback !== null}
            className="px-6 py-3 rounded-lg text-base font-bold text-gray-700 bg-gray-200 border-2 border-gray-300
                       hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button
                key={deg}
                onClick={() => onAnswerDegree(deg)}
                disabled={quiz.feedback !== null}
                style={isCorrectHighlight ? { background: '#22c55e', color: '#fff' } : { borderColor: color.border }}
                className={`px-4 py-3 rounded-lg text-base font-bold border-2 transition-colors
                  ${isCorrectHighlight ? '' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {deg}
              </button>
            );
          })}
        </div>
      )}

      {!started && (
        <button
          onClick={() => onStart(quiz.mode)}
          className="mx-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          スタート
        </button>
      )}
    </div>
  );
}
