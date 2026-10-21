import type { Accidental, FretPosition, IntervalName } from '../types';
import { getMidiAt, getNoteAt, INTERVAL_NAMES } from './fretboard';
import { computePhaseStatus, PHASES, STAGE_REQUIRED_CORRECT, STAGE_TEST_COUNT } from './phases';
import type { Phase, PhaseStatus } from './phases';

export const STAGE_PROGRESS_KEY = 'gft-stage-tutorial-v1';
export const TUTORIAL_ROOT: FretPosition = { string: 0, fret: 5 };

export interface DegreeQuestion {
  position: FretPosition;
  rootPosition: FretPosition;
  degree: IntervalName;
}
export function degreeOf(position: FretPosition, root: FretPosition): IntervalName {
  const delta = getMidiAt(position.string, position.fret) - getMidiAt(root.string, root.fret);
  return INTERVAL_NAMES[((delta % 12) + 12) % 12];
}

/** RNG は [0,1) を返す。候補を作ってから選ぶので再試行ループを持たない。 */
export function generateDegreeQuestion(stage: Phase, rng: () => number = Math.random): DegreeQuestion {
  if (stage.kind !== 'degree' || stage.degrees.length === 0) throw new Error('Expected a degree stage');
  const pick = <T,>(items: T[]): T => items[Math.floor(rng() * items.length)];
  const degree = pick(stage.degrees);
  const rootPosition = { string: pick([0, 1]), fret: pick([3, 4, 5, 6, 7, 8]) };
  const strings = stage.id === 'deg-cross' ? [4, 5] :
    [rootPosition.string, rootPosition.string + 1, rootPosition.string + 2];
  const candidates: FretPosition[] = [];
  for (const string of strings) {
    for (let fret = rootPosition.fret - 3; fret <= rootPosition.fret + 4; fret++) {
      if (string === rootPosition.string && fret === rootPosition.fret) continue;
      const position = { string, fret };
      if (degreeOf(position, rootPosition) === degree) candidates.push(position);
    }
  }
  if (candidates.length === 0) throw new Error('No position for the selected interval');
  return { position: pick(candidates), rootPosition, degree };
}

function countFromOpen(position: FretPosition, accidental: Accidental, prefer12 = false): string {
  const from12 = prefer12 && position.fret > 6;
  const start = from12 ? 12 : 0;
  const direction = from12 ? -1 : 1;
  const chain: string[] = [];
  for (let fret = start; direction > 0 ? fret <= position.fret : fret >= position.fret; fret += direction) {
    const note = getNoteAt(position.string, fret, accidental);
    if (!/[#b]/.test(note) || fret === position.fret) chain.push(note + '(' + fret + ')');
  }
  const anchor = getNoteAt(position.string, start, accidental);
  const answer = getNoteAt(position.string, position.fret, accidental);
  return from12
    ? `12F の ${anchor} から: ${chain.join(' ')} = ${answer}`
    : `開放 ${anchor} から: ${chain.join(' ')} = ${answer}`;
}

export function explainAnswer(
  stageId: string, position: FretPosition, rootPosition?: FretPosition,
  accidental: Accidental = 'sharp',
): string {
  const answer = getNoteAt(position.string, position.fret, accidental);
  if (stageId.startsWith('deg-') && rootPosition) {
    const degree = degreeOf(position, rootPosition);
    const semitones = INTERVAL_NAMES.indexOf(degree);
    const strings = position.string - rootPosition.string;
    const frets = position.fret - rootPosition.fret;
    const shapes: Record<string, string> = {
      '1:0': '細い隣の弦の同じフレット',
      '1:2': '細い隣の弦の2フレット先',
      '2:2': '2本細い弦の2フレット先',
      '1:-1': '細い隣の弦の1フレット手前',
      '1:-2': '細い隣の弦の2フレット手前',
      '2:0': '2本細い弦の同じフレット',
      '2:1': '2本細い弦の1フレット先',
      '2:-1': '2本細い弦の1フレット手前',
      '0:2': '同じ弦の2フレット先',
    };
    const route = shapes[strings + ':' + frets] ??
      `${strings}本細い弦、${frets}フレット移動`;
    const crossing = stageId === 'deg-cross' ? '。2弦をまたいだので1フレット右' : '';
    return `${degree} = ${route}（ルートから${semitones}半音）${crossing}。答え: ${degree}`;
  }
  if (stageId === 'open-strings') {
    return `6弦から E A D G B E。${6 - position.string}弦の開放音 = ${answer}`;
  }
  if (stageId === 'fret5-bridge' && position.string < 5 &&
      position.fret === (position.string === 3 ? 4 : 5)) {
    const nextString = 6 - (position.string + 1);
    return position.string === 3
      ? `3弦4フレット = 細い隣の弦(2弦)の開放音 ${answer}`
      : `5フレット = 細い隣の弦(${nextString}弦)の開放音 ${answer}`;
  }
  if (stageId === 'octave-shape' && position.string >= 2) {
    const offset = position.string >= 4 ? 3 : 2;
    const source = { string: position.string - 2, fret: position.fret - offset };
    if (source.fret >= 0) {
      return `${6 - source.string}弦${source.fret}F の ${answer} から、2本細い弦の${offset}フレット先 = ${answer}`;
    }
  }
  if (stageId === 'sharps-flats' && /[#b]/.test(answer)) {
    const flat = accidental === 'flat';
    const anchorFret = position.fret + (flat ? 1 : -1);
    const anchor = getNoteAt(position.string, anchorFret, accidental);
    return flat
      ? `${anchor}(${anchorFret}F) の1フレット左 = ${answer}`
      : `${anchor}(${anchorFret}F) の1フレット右 = ${answer}`;
  }
  return countFromOpen(position, accidental, stageId === 'octave-shape');
}

export interface StageProgress {
  seenAt: number | null;
  bestCorrect: number | null;
  bestAvgMs: number | null;
  clearedAt: number | null;
}
export type StageStatus = StageProgress & PhaseStatus;
const emptyProgress = (): StageProgress =>
  ({ seenAt: null, bestCorrect: null, bestAvgMs: null, clearedAt: null });
const validTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function readStageProgress(): Record<string, StageProgress> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STAGE_PROGRESS_KEY) ?? '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const result: Record<string, StageProgress> = {};
    for (const stage of PHASES) {
      const value: unknown = (raw as Record<string, unknown>)[stage.id];
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const p = value as Partial<StageProgress>;
      const validBest = typeof p.bestCorrect === 'number' && Number.isInteger(p.bestCorrect) &&
        p.bestCorrect >= 0 && p.bestCorrect <= STAGE_TEST_COUNT && validTime(p.bestAvgMs);
      result[stage.id] = {
        seenAt: validTime(p.seenAt) ? p.seenAt : null,
        clearedAt: validTime(p.clearedAt) ? p.clearedAt : null,
        bestCorrect: validBest ? p.bestCorrect! : null,
        bestAvgMs: validBest ? p.bestAvgMs! : null,
      };
    }
    return result;
  } catch { return {}; }
}
export function getStageProgress(stageId: string): StageProgress {
  return readStageProgress()[stageId] ?? emptyProgress();
}
function writeStageProgress(stageId: string, value: StageProgress): void {
  if (!PHASES.some((stage) => stage.id === stageId)) return;
  const progress = readStageProgress();
  progress[stageId] = value;
  try { localStorage.setItem(STAGE_PROGRESS_KEY, JSON.stringify(progress)); } catch { /* 継続可能 */ }
}
export function markStageSeen(stageId: string, now = Date.now()): void {
  const progress = getStageProgress(stageId);
  if (validTime(now)) writeStageProgress(stageId, { ...progress, seenAt: progress.seenAt ?? now });
}
export function passesStage(stage: Phase, correct: number, avgMs: number, count = STAGE_TEST_COUNT): boolean {
  return count === STAGE_TEST_COUNT && Number.isInteger(correct) &&
    correct >= STAGE_REQUIRED_CORRECT && correct <= count && validTime(avgMs) && avgMs <= stage.targetMs;
}
export function saveStageResult(
  stageId: string, correct: number, avgMs: number, count = STAGE_TEST_COUNT, now = Date.now(),
): StageProgress {
  const progress = getStageProgress(stageId);
  const stage = PHASES.find((p) => p.id === stageId);
  if (!stage || count !== STAGE_TEST_COUNT || !Number.isInteger(correct) ||
      correct < 0 || correct > count || !validTime(avgMs) || !validTime(now)) return progress;
  const better = progress.bestCorrect === null || correct > progress.bestCorrect ||
    (correct === progress.bestCorrect && avgMs < (progress.bestAvgMs ?? Infinity));
  const next: StageProgress = {
    ...progress,
    bestCorrect: better ? correct : progress.bestCorrect,
    bestAvgMs: better ? avgMs : progress.bestAvgMs,
    clearedAt: progress.clearedAt ?? (passesStage(stage, correct, avgMs, count) ? now : null),
  };
  writeStageProgress(stageId, next);
  return next;
}
export function getStageStatus(stage: Phase): StageStatus {
  const legacy = computePhaseStatus(stage);
  const progress = getStageProgress(stage.id);
  const clear = legacy.clear || progress.clearedAt !== null;
  return { ...legacy, ...progress, clear,
    started: legacy.started || progress.seenAt !== null || progress.bestCorrect !== null,
    progress: clear ? 1 : legacy.progress };
}
export function getNextStage(kind?: Phase['kind']): Phase | undefined {
  return PHASES.find((stage) => (!kind || stage.kind === kind) && !getStageStatus(stage).clear);
}
