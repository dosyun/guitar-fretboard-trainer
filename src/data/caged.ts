import type { CagedFormName, ChordTone, PentatonicDegree, FretPosition, NoteName } from '../types';
import { getNoteIndex } from './fretboard';

// --- 型定義 ---

export interface CagedPosition {
  string: number;       // 0=6弦, 5=1弦
  fretOffset: number;   // ルート基準フレットからのオフセット
  chordTone?: ChordTone;
  pentatonic?: PentatonicDegree;
}

export interface CagedForm {
  name: CagedFormName;
  rootString: number;   // ルート音の弦
  rootFretForC: number; // キーCでのルートフレット
  positions: CagedPosition[];
}

// --- フォーム色 ---

export const CAGED_COLORS: Record<CagedFormName, { bg: string; border: string; light: string }> = {
  C: { bg: '#dc2626', border: '#b91c1c', light: '#fecaca' },
  A: { bg: '#2563eb', border: '#1d4ed8', light: '#bfdbfe' },
  G: { bg: '#16a34a', border: '#15803d', light: '#bbf7d0' },
  E: { bg: '#ea580c', border: '#c2410c', light: '#fed7aa' },
  D: { bg: '#7c3aed', border: '#6d28d9', light: '#ddd6fe' },
};

// --- 5フォーム定義 (キーC基準) ---
// rootFretForC: キーCでのルート音フレット位置
// fretOffset: rootFretForCからの相対オフセット
// コードトーン: R=ルート, 3=長3度, 5=完全5度
// ペンタトニック: R,2,3,5,6 (メジャーペンタ = R,M2,M3,P5,M6)

// 各フォームをbuildFormで構築（キーC基準の絶対フレットから自動計算）

// Standard tuning MIDI: 6弦=E2(40), 5弦=A2(45), 4弦=D3(50), 3弦=G3(55), 2弦=B3(59), 1弦=E4(64)
// C major pentatonic: C(0), D(2), E(4), G(7), A(9) (mod 12)
// C major chord: C(0), E(4), G(7)

// Helper: given string index and fret, what note index (0-11)?
function noteAt(s: number, f: number): number {
  const tuning = [40, 45, 50, 55, 59, 64];
  return (tuning[s] + f) % 12;
}

// Build CAGED forms properly
interface RawPosition {
  string: number;
  fret: number;
}

function buildForm(
  name: CagedFormName,
  rootString: number,
  rootFretForC: number,
  chordPositions: RawPosition[],
  pentaPositions: RawPosition[],
): CagedForm {
  const positions: CagedPosition[] = [];
  const seen = new Set<string>();

  // Chord tone intervals: 0=R, 4=3, 7=5
  const chordMap: Record<number, ChordTone> = { 0: 'R', 4: '3', 7: '5' };
  // Penta intervals: 0=R, 2=2, 4=3, 7=5, 9=6
  const pentaMap: Record<number, PentatonicDegree> = { 0: 'R', 2: '2', 4: '3', 7: '5', 9: '6' };

  for (const p of chordPositions) {
    const key = `${p.string}-${p.fret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const interval = noteAt(p.string, p.fret);
    // interval relative to C (note index 0)
    const ct = chordMap[interval];
    const pt = pentaMap[interval];
    positions.push({
      string: p.string,
      fretOffset: p.fret - rootFretForC,
      chordTone: ct,
      pentatonic: pt,
    });
  }

  for (const p of pentaPositions) {
    const key = `${p.string}-${p.fret}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const interval = noteAt(p.string, p.fret);
    const pt = pentaMap[interval];
    if (pt) {
      positions.push({
        string: p.string,
        fretOffset: p.fret - rootFretForC,
        pentatonic: pt,
      });
    }
  }

  return { name, rootString, rootFretForC, positions };
}

// C form (open C shape): frets 0-3, root on 5弦3F
const C_FORM_DEF = buildForm('C', 1, 3,
  // Chord: C major open shape
  [
    { string: 1, fret: 3 },  // C (R)
    { string: 2, fret: 2 },  // E (3)
    { string: 3, fret: 0 },  // G (5)  -- wait, 3弦0F = G
    { string: 4, fret: 1 },  // C (R)
    { string: 5, fret: 0 },  // E (3)
  ],
  // Pentatonic pattern around C form
  [
    { string: 0, fret: 0 },  // E (3)
    { string: 0, fret: 3 },  // G (5)
    { string: 1, fret: 0 },  // A (6)
    { string: 1, fret: 2 },  // B → not penta, skip
    { string: 1, fret: 3 },  // C (R)
    { string: 2, fret: 0 },  // D (2)
    { string: 2, fret: 2 },  // E (3)
    { string: 3, fret: 0 },  // G (5)
    { string: 3, fret: 2 },  // A (6)
    { string: 4, fret: 0 },  // B → not penta
    { string: 4, fret: 1 },  // C (R)
    { string: 4, fret: 3 },  // D (2)
    { string: 5, fret: 0 },  // E (3)
    { string: 5, fret: 3 },  // G (5)
  ],
);

// A form: frets 3-5 for key of C, root on 5弦3F (same string as C, connects)
// A shape barre at 3rd fret
const A_FORM_DEF = buildForm('A', 1, 3,
  [
    { string: 1, fret: 3 },  // C (R)
    { string: 2, fret: 5 },  // G (5)
    { string: 3, fret: 5 },  // C (R)
    { string: 4, fret: 5 },  // E (3)
    { string: 5, fret: 3 },  // G (5) -- barre
  ],
  [
    { string: 0, fret: 3 },  // G (5)
    { string: 0, fret: 5 },  // A (6)
    { string: 1, fret: 3 },  // C (R)
    { string: 1, fret: 5 },  // D (2)
    { string: 2, fret: 2 },  // E (3)
    { string: 2, fret: 5 },  // G (5)
    { string: 3, fret: 2 },  // A (6)
    { string: 3, fret: 5 },  // C (R)
    { string: 4, fret: 3 },  // D (2)
    { string: 4, fret: 5 },  // E (3)
    { string: 5, fret: 3 },  // G (5)
    { string: 5, fret: 5 },  // A (6)
  ],
);

// G form: frets 5-8, root on 6弦8F
const G_FORM_DEF = buildForm('G', 0, 8,
  [
    { string: 0, fret: 8 },  // C (R)
    { string: 1, fret: 7 },  // E (3)
    { string: 2, fret: 5 },  // G (5)
    { string: 3, fret: 5 },  // C (R)
    { string: 4, fret: 5 },  // E (3)
    { string: 5, fret: 8 },  // C (R)
  ],
  [
    { string: 0, fret: 5 },  // A (6)
    { string: 0, fret: 7 },  // B → not penta... wait 6弦7F = B. skip
    { string: 0, fret: 8 },  // C (R)
    { string: 1, fret: 5 },  // D (2)
    { string: 1, fret: 7 },  // E (3)
    { string: 2, fret: 5 },  // G (5)
    { string: 2, fret: 7 },  // A (6)
    { string: 3, fret: 5 },  // C (R)
    { string: 3, fret: 7 },  // D (2)
    { string: 4, fret: 5 },  // E (3)
    { string: 4, fret: 8 },  // G (5)
    { string: 5, fret: 5 },  // A (6)
    { string: 5, fret: 8 },  // C (R)
  ],
);

// E form: frets 7-10, root on 6弦8F
const E_FORM_DEF = buildForm('E', 0, 8,
  [
    { string: 0, fret: 8 },   // C (R)
    { string: 1, fret: 10 },  // G (5)
    { string: 2, fret: 10 },  // C (R)
    { string: 3, fret: 9 },   // E (3)
    { string: 4, fret: 8 },   // G (5)  -- wait 2弦8F = (59+8)%12 = 67%12 = 7 = G. yes
    { string: 5, fret: 8 },   // C (R)
  ],
  [
    { string: 0, fret: 7 },   // B → not penta. 6弦7F = (40+7)%12=47%12=11=B. skip
    { string: 0, fret: 8 },   // C (R)
    { string: 0, fret: 10 },  // D (2)
    { string: 1, fret: 7 },   // E (3)
    { string: 1, fret: 10 },  // G (5)
    { string: 2, fret: 7 },   // A (6)
    { string: 2, fret: 10 },  // C (R)
    { string: 3, fret: 7 },   // D (2)
    { string: 3, fret: 9 },   // E (3)
    { string: 4, fret: 8 },   // G (5) -- (59+8)%12=7=G yes
    { string: 4, fret: 10 },  // A (6)
    { string: 5, fret: 8 },   // C (R)
    { string: 5, fret: 10 },  // D (2)
  ],
);

// D form: root on 4弦10F for key of C
const D_FORM_FINAL = buildForm('D', 2, 10,
  [
    { string: 2, fret: 10 },  // C (R)
    { string: 3, fret: 12 },  // G (5)
    { string: 4, fret: 13 },  // C (R) -- may exceed 12F but that's ok
    { string: 5, fret: 12 },  // E (3)
  ],
  [
    { string: 1, fret: 10 },  // G (5) -- (45+10)%12=55%12=7=G ✓
    { string: 1, fret: 12 },  // A (6)
    { string: 2, fret: 10 },  // C (R)
    { string: 2, fret: 12 },  // D (2)
    { string: 3, fret: 10 },  // (55+10)%12=65%12=5=F → not penta, skip
    { string: 3, fret: 12 },  // G (5)
    { string: 4, fret: 10 },  // A (6)
    { string: 4, fret: 13 },  // C (R)
    { string: 5, fret: 10 },  // D (2)
    { string: 5, fret: 12 },  // E (3)
  ],
);

// Export all forms
export const CAGED_FORMS: Record<CagedFormName, CagedForm> = {
  C: C_FORM_DEF,
  A: A_FORM_DEF,
  G: G_FORM_DEF,
  E: E_FORM_DEF,
  D: D_FORM_FINAL,
};

export const CAGED_ORDER: CagedFormName[] = ['C', 'A', 'G', 'E', 'D'];

// --- ユーティリティ ---

/** キーCからの半音差を計算 */
function getTranspose(rootNote: NoteName): number {
  return getNoteIndex(rootNote); // C=0, C#=1, D=2, ...
}

/** CAGEDフォームを任意のキーに転調した絶対ポジションを取得 */
export function getCagedPositions(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
): { pos: FretPosition; chordTone?: ChordTone; pentatonic?: PentatonicDegree }[] {
  const form = CAGED_FORMS[formName];
  const transpose = getTranspose(rootNote);

  return form.positions
    .map((p) => {
      const fret = form.rootFretForC + p.fretOffset + transpose;
      return {
        pos: { string: p.string, fret },
        chordTone: p.chordTone,
        pentatonic: p.pentatonic,
      };
    })
    .filter((p) => p.pos.fret >= 0 && p.pos.fret <= maxFret);
}

/** コードトーンのみ取得 */
export function getCagedChordTones(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
) {
  return getCagedPositions(formName, rootNote, maxFret).filter((p) => p.chordTone);
}

/** ペンタトニック音のみ取得 */
export function getCagedPentatonic(
  formName: CagedFormName,
  rootNote: NoteName,
  maxFret: number = 22,
) {
  return getCagedPositions(formName, rootNote, maxFret).filter((p) => p.pentatonic);
}

/** 全5フォームを取得 */
export function getAllCagedForms(rootNote: NoteName, maxFret: number = 22) {
  return CAGED_ORDER.map((name) => ({
    name,
    positions: getCagedPositions(name, rootNote, maxFret),
  }));
}
