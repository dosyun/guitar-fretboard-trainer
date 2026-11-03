import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelScheduled, getAudioState, getAudioTime, isSoundEnabled, scheduleChord, scheduleClick,
} from '../data/audio';
import type { ScheduledAudio } from '../data/audio';
import { buildBeatSchedule } from '../data/beatSchedule';
import type { CourseBpm } from '../data/courseStore';

export interface BeatPlayerOptions {
  progression: { id: string; midis: number[] }[];
  bpm: CourseBpm;
  soundEnabled: boolean;
  barsPerChord?: number;
}

interface PlayerState {
  isPlaying: boolean;
  hasFinished: boolean;
  hasStarted: boolean;
  unavailable: boolean;
  failed: boolean;
  currentChord: string | null;
  nextChord: string | null;
  isCountIn: boolean;
  beatInBar: number;
}

const idle: PlayerState = {
  isPlaying: false, hasFinished: false, hasStarted: false, unavailable: false, failed: false, currentChord: null,
  nextChord: null, isCountIn: false, beatInBar: 0,
};

/** 150ms先まで予約し、表示は実際に到達した AudioContext の時刻だけで更新する。 */
export function useBeatPlayer({
  progression, bpm, soundEnabled, barsPerChord = 2,
}: BeatPlayerOptions) {
  const [state, setState] = useState<PlayerState>(idle);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sounds = useRef<ScheduledAudio[]>([]);
  const progressionKey = JSON.stringify(progression);

  const clear = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
    cancelScheduled(sounds.current);
    sounds.current = [];
  }, []);

  const stop = useCallback(() => {
    clear();
    setState((previous) => ({ ...idle, hasStarted: previous.hasStarted }));
  }, [clear]);

  useEffect(() => clear, [clear]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const changed = () => { if (!isSoundEnabled()) stop(); };
    window.addEventListener('gft-sound-change', changed);
    return () => window.removeEventListener('gft-sound-change', changed);
  }, [stop]);

  const start = useCallback(() => {
    stop();
    if (!soundEnabled || !isSoundEnabled()) return;
    const now = getAudioTime();
    if (now === null) { setState({ ...idle, unavailable: true }); return; }
    const chords = JSON.parse(progressionKey) as BeatPlayerOptions['progression'];
    if (chords.length !== 2 && chords.length !== 4) return;
    const repeated = Array.from({ length: 8 / chords.length }, () => chords).flat();
    const beats = buildBeatSchedule({
      startTime: now + 0.05, bpm, progression: repeated.map((chord) => chord.id),
      barsPerChord, countInBars: 1,
    });
    const endTime = beats[beats.length - 1].time + 60 / bpm;
    let queued = 0;
    let shown = -1;
    const startedAt = performance.now();
    setState({ ...idle, hasStarted: true, isPlaying: true, isCountIn: true, nextChord: chords[0].id });

    const tick = () => {
      if (!isSoundEnabled()) { stop(); return; }
      const time = getAudioTime();
      if (time === null) {
        clear();
        setState({ ...idle, hasStarted: true, unavailable: true });
        return;
      }
      if (performance.now() - startedAt >= 1000 && getAudioState() !== 'running') {
        clear();
        setState({ ...idle, hasStarted: true, failed: true });
        return;
      }
      if (time >= endTime) {
        clear();
        setState({ ...idle, hasStarted: true, hasFinished: true });
        return;
      }
      while (queued < beats.length && beats[queued].time <= time + 0.15) {
        const beat = beats[queued];
        if (beat.time >= time) {
          sounds.current.push(scheduleClick(beat.time, beat.isBarStart));
          if (beat.chord !== null && beat.chord !== beats[queued - 1]?.chord) {
            const chord = chords.find((item) => item.id === beat.chord);
            if (chord) sounds.current.push(scheduleChord(chord.midis, beat.time));
          }
        }
        queued += 1;
      }
      let current = shown;
      while (current + 1 < beats.length && beats[current + 1].time <= time) current += 1;
      if (current !== shown) {
        shown = current;
        const beat = beats[shown];
        setState({
          ...idle, hasStarted: true, isPlaying: true, currentChord: beat.chord,
          nextChord: beat.nextChord, isCountIn: beat.isCountIn, beatInBar: beat.beatInBar,
        });
      }
    };
    timer.current = setInterval(tick, 25);
    tick();
  }, [stop, clear, soundEnabled, progressionKey, bpm, barsPerChord]);

  return { ...state, start, stop };
}
