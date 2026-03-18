import type { CagedFormName } from '../types';
import { CAGED_COLORS, CAGED_ORDER } from '../data/caged';

interface CagedFormSelectorProps {
  selectedForms: CagedFormName[];
  onChange: (forms: CagedFormName[]) => void;
}

export function CagedFormSelector({ selectedForms, onChange }: CagedFormSelectorProps) {
  const toggle = (form: CagedFormName) => {
    if (selectedForms.includes(form)) {
      if (selectedForms.length > 1) {
        onChange(selectedForms.filter((f) => f !== form));
      }
    } else {
      onChange([...selectedForms, form]);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <span className="text-sm text-gray-500">フォーム:</span>
      {CAGED_ORDER.map((form) => {
        const color = CAGED_COLORS[form];
        const selected = selectedForms.includes(form);
        return (
          <button
            key={form}
            onClick={() => toggle(form)}
            style={selected ? { background: color.bg, color: '#fff', borderColor: color.border } : {}}
            className={`
              w-10 h-10 rounded-lg text-base font-bold transition-opacity border-2
              ${selected ? '' : 'bg-gray-100 text-gray-400 border-gray-200 opacity-50'}
            `}
          >
            {form}
          </button>
        );
      })}
      <button
        onClick={() => onChange([...CAGED_ORDER])}
        className="px-3 py-2 rounded text-xs text-gray-500 hover:bg-gray-100"
      >
        全表示
      </button>
    </div>
  );
}
