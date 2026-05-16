import { RECIPES } from '../data/recipes';
import { GridCard } from '../components/GridCard';
import type { Recipe } from '../types';

interface CookingViewProps {
  making: number[];
  cooked: number[];
  pantry: string[];
  cookbook: number[];
  ratings: Record<number, 1 | 2 | 3>;
  removeFromMaking: (id: number) => void;
  addToCookbook: (id: number) => void;
  openDetail: (id: number) => void;
  onCookNow: (id: number) => void;
  onRate: (id: number, stars: 1 | 2 | 3) => void;
}

export function CookingView({
  making,
  cooked,
  pantry,
  cookbook,
  ratings,
  removeFromMaking,
  addToCookbook,
  openDetail,
  onCookNow,
  onRate,
}: CookingViewProps) {
  const makingRecipes = making
    .map((id) => RECIPES.find((r) => r.id === id))
    .filter((r): r is Recipe => r !== undefined);

  const cookedRecipes = cooked
    .map((id) => RECIPES.find((r) => r.id === id))
    .filter((r): r is Recipe => r !== undefined);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 pt-2 pb-4 flex-shrink-0">
        <p className="font-body text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-semibold">
          Ready to cook
        </p>
        <h1 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight">
          Cooking Up
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32">
        {/* Active cooking queue */}
        {makingRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {makingRecipes.map((r, i) => (
              <GridCard
                key={r.id}
                recipe={r}
                pantry={pantry}
                onRemove={removeFromMaking}
                removeLabel="Remove from cooking list"
                onSave={addToCookbook}
                saved={cookbook.includes(r.id)}
                onCook={onCookNow}
                openDetail={openDetail}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center px-10 py-16"
            style={{ animation: 'float-in 0.5s ease-out' }}
          >
            <div className="text-7xl mb-5">🔥</div>
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[26px] leading-tight mb-3">
              Nothing cooking yet
            </h2>
            <p className="font-body text-[var(--text-secondary)] text-[15px] leading-relaxed">
              Swipe right (or tap the heart) on recipes you want to make.
            </p>
          </div>
        )}

        {/* Previously cooked */}
        {cookedRecipes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
              <p className="font-body text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Previously cooked
              </p>
              <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {cookedRecipes.map((r, i) => (
                <GridCard
                  key={r.id}
                  recipe={r}
                  pantry={pantry}
                  onSave={addToCookbook}
                  saved={cookbook.includes(r.id)}
                  onCook={onCookNow}
                  openDetail={openDetail}
                  index={i}
                  rating={ratings[r.id]}
                  onRate={onRate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
