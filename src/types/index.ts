export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type NoteNameFlat =
  | 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F'
  | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';

export type IntervalName =
  | 'R' | 'm2' | 'M2' | 'm3' | 'M3' | 'P4'
  | '#4/b5' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7';

export interface FretPosition {
  string: number; // 0=6弦(低いE), 5=1弦(高いE)
  fret: number;   // 0=開放弦, 1-12
}

export type QuizMode = 'position-to-note' | 'note-to-position' | 'interval';

export type Accidental = 'sharp' | 'flat' | 'both';

export type Feedback = 'correct' | 'wrong' | null;

export interface QuizState {
  mode: QuizMode;
  currentPosition: FretPosition | null;   // Mode1, Mode3: ハイライト位置
  currentNote: string | null;              // Mode2: 表示する音名
  rootNote: NoteName;                      // Mode3: ルート音
  feedback: Feedback;
  correctAnswer: string | null;            // 不正解時に正解を表示
}

export interface ScoreState {
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
}

export interface AppSettings {
  maxFret: number;
  accidental: Accidental;
}

// CAGED
export type CagedFormName = 'C' | 'A' | 'G' | 'E' | 'D';
export type ChordTone = 'R' | '3' | '5';
export type PentatonicDegree = 'R' | '2' | '3' | '5' | '6';
export type CagedQuizMode = 'identify-form' | 'place-positions' | 'identify-chord-tone';
