import { useAppStore } from '../store/appStore';
import type { UnitSystem } from '../lib/units';

const OPTIONS: Array<{ val: UnitSystem; label: string }> = [
  { val: 'original', label: 'As written' },
  { val: 'metric', label: 'Metric' },
  { val: 'imperial', label: 'US' },
];

/** Segmented control for how ingredient amounts are shown (persisted). */
export function UnitToggle({ dark = false }: { dark?: boolean }) {
  const units = useAppStore((s) => s.units);
  const setUnits = useAppStore((s) => s.setUnits);
  return (
    <div role="radiogroup" aria-label="Units" className="inline-flex p-0.5 rounded-full" style={{ background: dark ? 'rgba(255,255,255,0.12)' : 'var(--surface-cream)' }}>
      {OPTIONS.map((o) => {
        const active = units === o.val;
        return (
          <button
            key={o.val}
            role="radio"
            aria-checked={active}
            onClick={() => setUnits(o.val)}
            className="px-2.5 py-1 rounded-full font-body text-[12px] font-semibold transition-colors"
            style={{
              background: active ? (dark ? 'white' : 'var(--surface-dark)') : 'transparent',
              color: active ? (dark ? 'var(--surface-dark)' : 'white') : dark ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
