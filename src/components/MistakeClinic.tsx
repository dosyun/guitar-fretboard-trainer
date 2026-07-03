import { diagnose } from '../data/mistakeClinic';
import type { Accidental } from '../types';

interface MistakeClinicProps {
  accidental: Accidental;
  onDrill: (note: string | string[]) => void;
  onDrillString: (string: number) => void;
  onDrillFret: (range: [number, number]) => void;
}

/** 弱点を言語化して見せる診断カード。データが乏しければ何も出さない。 */
export function MistakeClinic({ accidental, onDrill, onDrillString, onDrillFret }: MistakeClinicProps) {
  const diags = diagnose(accidental);
  if (diags.length === 0) return null;

  return (
    <div className="bg-surface border border-hair rounded-2xl p-4 space-y-3">
      <h2 className="text-sm font-medium text-ink">弱点診断</h2>
      <ul className="space-y-2">
        {diags.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink text-pretty">{d.text}</span>
            {d.drillNotes ? (
              <button
                onClick={() => onDrill(d.drillNotes!)}
                className="shrink-0 text-accent text-xs hover:opacity-80 whitespace-nowrap"
              >
                両方を練習 →
              </button>
            ) : d.drillNote ? (
              <button
                onClick={() => onDrill(d.drillNote!)}
                className="shrink-0 text-accent text-xs hover:opacity-80 whitespace-nowrap"
              >
                練習 →
              </button>
            ) : d.drillString != null ? (
              <button
                onClick={() => onDrillString(d.drillString!)}
                className="shrink-0 text-accent text-xs hover:opacity-80 whitespace-nowrap"
              >
                この弦を練習 →
              </button>
            ) : d.drillFretRange ? (
              <button
                onClick={() => onDrillFret(d.drillFretRange!)}
                className="shrink-0 text-accent text-xs hover:opacity-80 whitespace-nowrap"
              >
                この範囲を練習 →
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-dim text-pretty">弱点を言語化。練習はこれらを優先して出題されます。</p>
    </div>
  );
}
