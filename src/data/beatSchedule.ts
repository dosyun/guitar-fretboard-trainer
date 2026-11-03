export interface BeatScheduleOptions {
  startTime: number;
  bpm: number;
  progression: string[];
  barsPerChord?: number;
  beatsPerBar?: number;
  countInBars?: number;
  loop?: boolean;
}

export interface ScheduledBeat {
  time: number;
  beatIndex: number;
  beatInBar: number;
  barIndex: number;
  isBarStart: boolean;
  chord: string | null;
  nextChord: string | null;
  isCountIn: boolean;
}

/** ループ指定でも1周分だけ返す。最後のコードの予告のみ先頭へ戻す。 */
export function buildBeatSchedule({
  startTime,
  bpm,
  progression,
  barsPerChord = 2,
  beatsPerBar = 4,
  countInBars = 1,
  loop = false,
}: BeatScheduleOptions): ScheduledBeat[] {
  if (!Number.isFinite(startTime) || !Number.isFinite(bpm) || bpm <= 0
    || !Number.isInteger(barsPerChord) || barsPerChord < 1
    || !Number.isInteger(beatsPerBar) || beatsPerBar < 1
    || !Number.isInteger(countInBars) || countInBars < 0) {
    throw new RangeError('Invalid beat schedule options');
  }
  if (progression.length === 0) return [];
  const countInBeats = countInBars * beatsPerBar;
  const chordBeats = barsPerChord * beatsPerBar;
  const totalBeats = countInBeats + progression.length * chordBeats;
  return Array.from({ length: totalBeats }, (_, beatIndex) => {
    const isCountIn = beatIndex < countInBeats;
    const chordIndex = Math.floor((beatIndex - countInBeats) / chordBeats);
    return {
      time: startTime + beatIndex * (60 / bpm),
      beatIndex,
      beatInBar: beatIndex % beatsPerBar + 1,
      barIndex: Math.floor(beatIndex / beatsPerBar),
      isBarStart: beatIndex % beatsPerBar === 0,
      chord: isCountIn ? null : progression[chordIndex],
      nextChord: isCountIn ? progression[0]
        : progression[chordIndex + 1] ?? (loop ? progression[0] : null),
      isCountIn,
    };
  });
}
