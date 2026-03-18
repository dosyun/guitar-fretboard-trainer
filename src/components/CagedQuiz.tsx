import { Fretboard } from './Fretboard';
import { ScoreBoard } from './ScoreBoard';
import { CAGED_COLORS, CAGED_ORDER } from '../data/caged';
import type { CagedQuizMode, CagedFormName, NoteName, Accidental, FretPosition, ScoreState } from '../types';

interface CagedQuizProps {
  quiz: {
    mode: CagedQuizMode;
    targetForm: CagedFormName;
    highlightedPositions: FretPosition[];
    currentPosition: FretPosition | null;
    feedback: 'correct' | 'wrong' | null;
    correctAnswer: string | null;
  };
  started: boolean;
  score: ScoreState;
  rootNote: NoteName;
  accidental: Accidental;
  maxFret: number;
  onStart: (mode: CagedQuizMode) => void;
  onSetMode: (mode: CagedQuizMode) => void;
  onAnswerForm: (form: CagedFormName) => void;
  onAnswerChordTone: (tone: string) => void;
  onAnswerPosition: (pos: FretPosition) => void;
}

const QUIZ_MODES: { value: CagedQuizMode; label: string }[] = [
  { value: 'identify-form', label: 'フォーム当て' },
  { value: 'place-positions', label: 'ポジション当て' },
  { value: 'identify-chord-tone', label: 'コードトーン当て' },
];

export function CagedQuiz({
  quiz,
  started,
  score,
  rootNote,
  accidental,
  maxFret,
  onStart,
  onSetMode,
  onAnswerForm,
  onAnswerChordTone,
  onAnswerPosition,
}: CagedQuizProps) {
  const getPrompt = () => {
    if (!started) return null;
    switch (quiz.mode) {
      case 'identify-form':
        return `このポジション群は何フォーム？ (Key: ${rootNote})`;
      case 'place-positions':
        return `${quiz.targetForm}フォーム (Key: ${rootNote}) のコードトーンをタップ`;
      case 'identify-chord-tone':
        return `${quiz.targetForm}フォーム内のハイライト位置のコードトーンは？ (Key: ${rootNote})`;
    }
  };

  const getFeedbackMsg = () => {
    if (!quiz.feedback) return null;
    if (quiz.feedback === 'correct') return '正解!';
    if (quiz.correctAnswer) return `不正解... 正解: ${quiz.correctAnswer}`;
    return '不正解...';
  };

  // identify-form/identify-chord-tone: ハイライト表示用
  // フレットボードでCAGEDポジション群を表示
  const highlightFirst = quiz.highlightedPositions[0] ?? null;

  // showLabelAt: identify-chord-tone で対象ポジション以外も薄く表示
  const showLabelAt = (_s: number, _f: number): string | undefined => {
    return undefined;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* モード選択 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {QUIZ_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onSetMode(value)}
            className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors ${
              quiz.mode === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* スコア */}
      {started && <ScoreBoard score={score} />}

      {/* 問題文 */}
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

      {/* フレットボード */}
      {started && (
        <div className="overflow-x-auto">
          <Fretboard
            maxFret={maxFret}
            accidental={accidental}
            highlightPosition={quiz.mode === 'identify-chord-tone' ? quiz.currentPosition : highlightFirst}
            feedback={quiz.feedback}
            showLabelAt={showLabelAt}
            onPositionClick={quiz.mode === 'place-positions' ? onAnswerPosition : undefined}
          />
          {/* 追加のポジションハイライトをオーバーレイ的にSVGで描画するのは複雑なので、
              identify-form では最初のポジションだけをメインハイライトし、
              残りは別途表示する方法を取る */}
        </div>
      )}

      {/* 回答ボタン */}
      {started && quiz.mode === 'identify-form' && (
        <div className="flex gap-2 justify-center">
          {CAGED_ORDER.map((form) => {
            const color = CAGED_COLORS[form];
            const isCorrectHighlight = quiz.feedback === 'wrong' && form === quiz.correctAnswer;
            return (
              <button
                key={form}
                onClick={() => onAnswerForm(form)}
                disabled={quiz.feedback !== null}
                style={isCorrectHighlight
                  ? { background: '#22c55e', color: '#fff' }
                  : { background: color.bg, color: '#fff', borderColor: color.border }
                }
                className="w-14 h-14 rounded-lg text-xl font-bold border-2 transition-opacity
                           hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {form}
              </button>
            );
          })}
        </div>
      )}

      {started && quiz.mode === 'identify-chord-tone' && (
        <div className="flex gap-2 justify-center">
          {(['R', '3', '5'] as const).map((tone) => {
            const isCorrectHighlight = quiz.feedback === 'wrong' && tone === quiz.correctAnswer;
            return (
              <button
                key={tone}
                onClick={() => onAnswerChordTone(tone)}
                disabled={quiz.feedback !== null}
                className={`w-16 h-14 rounded-lg text-xl font-bold border-2 transition-colors
                  ${isCorrectHighlight
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {tone}
              </button>
            );
          })}
        </div>
      )}

      {/* スタートボタン */}
      {!started && (
        <button
          onClick={() => onStart(quiz.mode)}
          className="mx-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg
                     hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          スタート
        </button>
      )}
    </div>
  );
}
