import { useShallow } from 'zustand/react/shallow';
import { CalendarPlus } from 'lucide-react';
import { useAppStore, DAYS, DAY_LABELS } from '../store/appStore';

/** Toggle a recipe on days of the weekly meal plan. */
export function PlanPicker({ recipeId }: { recipeId: number }) {
  const { mealPlan, addToPlan, removeFromPlan } = useAppStore(
    useShallow((s) => ({ mealPlan: s.mealPlan, addToPlan: s.addToPlan, removeFromPlan: s.removeFromPlan })),
  );
  return (
    <div className="mb-7">
      <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] mb-3 flex items-center gap-2">
        <CalendarPlus size={20} strokeWidth={2.4} aria-hidden="true" />
        Plan this week
      </h2>
      <div className="flex gap-1.5" role="group" aria-label="Days to cook this recipe">
        {DAYS.map((d) => {
          const on = mealPlan[d].includes(recipeId);
          return (
            <button
              key={d}
              aria-pressed={on}
              onClick={() => (on ? removeFromPlan(d, recipeId) : addToPlan(d, recipeId))}
              className="flex-1 py-2 rounded-xl font-body text-[12px] font-semibold active:scale-95 transition-all"
              style={{
                background: on ? 'var(--surface-dark)' : 'white',
                color: on ? 'white' : 'var(--text-secondary)',
                border: `1.5px solid ${on ? 'var(--surface-dark)' : 'var(--border-default)'}`,
              }}
            >
              {DAY_LABELS[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
