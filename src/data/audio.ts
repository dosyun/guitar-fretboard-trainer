/**
 * 音を鳴らす（Web Audio）。サンプル不要のプラック風シンセでオフライン/PWAでも動く。
 * - タップした音、インターバル、トライアド、スケールを「聴く」体験で、
 *   理論を“見る”だけでなく“聞いて”身体化する（弾く→聞く→名前）。
 * - on/off は localStorage に保存（既定=on）。AudioContext はユーザー操作時に生成/再開。
 */
const SOUND_KEY = 'gft-sound-v1';

let ctx: AudioContext | null = null;
let enabled = loadEnabled();

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  if (on) {
    // 切替時に小さく鳴らして“出た”ことを示す（ユーザー操作中なので解錠もできる）
    playMidi(69, 0, 0.5, 0.6);
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** 1音をプラック風エンベロープで鳴らす。when=遅延秒, dur=長さ秒。 */
export function playMidi(midi: number, when = 0, dur = 0.9, gainScale = 1): void {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = midiToFreq(midi);
  const peak = Math.max(0.0002, 0.2 * gainScale);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** 和音（同時に鳴らす）。 */
export function playChord(midis: number[]): void {
  midis.forEach((m) => playMidi(m, 0, 1.5, 0.7));
}

/** 分散（アルペジオ、step秒間隔で上昇）。 */
export function playArpeggio(midis: number[], step = 0.16): void {
  midis.forEach((m, i) => playMidi(m, i * step, 0.9, 0.9));
}
