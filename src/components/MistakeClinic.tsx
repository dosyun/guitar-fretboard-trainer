import { diagnose } from '../data/mistakeClinic';
import type { Accidental } from '../types';

interface MistakeClinicProps {
  accidental: Accidental;
  onDrill: (note: string) => void;
}

/** 弱点を言語化して見せる診断カード。データが乏しければ何も出さない。 */
export function MistakeClinic({ accidental, onDrill }: MistakeClinicProps) {
  const diags = diagnose(accidental);
  if (diags.length === 0) return null;

  return (
    <div className="bg-surface border border-hair rounded-2xl p-4 space-y-3">
      <h2 className="text-sm font-medium text-ink">弱点診断</h2>
      <ul className="space-y-2">
        {diags.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-ink text-pretty">{d.text}</span>
            {d.drillNote && (
              <button
                onClick={() => onDrill(d.drillNote!)}
                className="shrink-0 text-accent text-xs hover:opacity-80 whitespace-nowrap"
              >
                練習 →
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-dim text-pretty">弱点を言語化。練習はこれらを優先して出題されます。</p>
    </div>
  );
}
