import { CAGED_COLORS, CAGED_ORDER } from '../data/caged';

interface CagedLegendProps {
  showPentatonic: boolean;
}

export function CagedLegend({ showPentatonic }: CagedLegendProps) {
  return (
    <div className="flex flex-wrap gap-4 justify-center text-xs text-gray-600">
      <div className="flex items-center gap-3">
        {CAGED_ORDER.map((form) => (
          <div key={form} className="flex items-center gap-1">
            <span
              className="w-4 h-4 rounded-full inline-block border"
              style={{ background: CAGED_COLORS[form].bg, borderColor: CAGED_COLORS[form].border }}
            />
            <span>{form}フォーム</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full inline-block bg-white border-2 border-gray-400" />
          <span>コードトーン (R/3/5)</span>
        </div>
        {showPentatonic && (
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block bg-white border-2 border-dashed border-gray-400" />
            <span>ペンタトニック</span>
          </div>
        )}
      </div>
    </div>
  );
}
