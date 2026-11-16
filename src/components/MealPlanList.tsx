import { useShallow } from 'zustand/react/shallow';
import { X, Flame } from 'lucide-react';
import { useAppStore, DAYS, DAY_LABELS } from '../store/appStore';
import { useRecipes } from '../context/recipes';

interface MealPlanListProps {
  openDetail: (id: number) => void;
  onCook: (id: number) => void;
}

/** The weekly meal plan, one row per day. Recipes are added from a recipe's detail page. */
export function MealPlanList({ openDetail, onCook }: MealPlanListProps) {
  const { mealPlan, removeFromPlan, clearPlan } = useAppStore(
    useShallow((s) => ({ mealPlan: s.mealPlan, removeFromPlan: s.removeFromPlan, clearPlan: s.clearPlan })),
  );
  const { byId } = useRecipes();
  const planned = DAYS.reduce((n, d) => n + mealPlan[d].length, 0);

  if (planned === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10 pb-32">
        <div className="text-7xl mb-5">🗓️</div>
        <h2 className="font-display font-semibold text-[var(--text-primary)] text-[26px] leading-tight mb-3">Nothing planned yet</h2>
        <p className="font-body text-[var(--text-secondary)] text-[15px] leading-relaxed">
          Open any recipe and pick days under “Plan this week”. Planned recipes go on your shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32">
      <ol className="space-y-3">
        {DAYS.map((d) => (
          <li key={d} className="bg-white rounded-2xl px-4 py-3">
            <p className="font-body text-[12px] uppercase tracking-[0.14em] font-semibold text-[var(--text-tertiary)] mb-1">{DAY_LABELS[d]}</p>
            {mealPlan[d].length === 0 ? (
              <p className="font-body text-[14px] text-[var(--text-tertiary)]">—</p>
            ) : (
              <ul className="space-y-1">
                {mealPlan[d].map((id) => {
                  const r = byId.get(id);
                  if (!r) return null;
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <button onClick={() => openDetail(id)} className="flex-1 min-w-0 text-left flex items-center gap-2 py-1">
                        <span className="text-[20px]" aria-hidden="true">{r.emoji}</span>
                        <span className="font-body text-[15px] font-medium text-[var(--text-primary)] truncate">{r.name}</span>
                        <span className="font-body text-[12px] text-[var(--text-tertiary)] flex-shrink-0">{r.cookTime} min</span>
                      </button>
                      <button onClick={() => onCook(id)} aria-label={`Cook ${r.name}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'var(--brand-500)' }}>
                        <Flame size={14} strokeWidth={2.6} className="text-white" />
                      </button>
                      <button onClick={() => removeFromPlan(d, id)} aria-label={`Remove ${r.name} from ${DAY_LABELS[d]}`}
                        className="w-8 h-8 rounded-full bg-[var(--surface-muted)] flex items-center justify-center active:scale-90 transition-transform">
                        <X size={14} strokeWidth={2.8} className="text-[var(--text-secondary)]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <button onClick={clearPlan} className="mt-4 w-full py-3 font-body text-[14px] font-semibold text-[var(--text-secondary)] border-2 border-[var(--border-default)] rounded-2xl bg-white active:scale-95 transition-transform">
        Clear the week
      </button>
    </div>
  );
}
