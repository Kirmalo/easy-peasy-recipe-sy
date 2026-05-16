import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useStorage } from './hooks/useStorage';
import { KitchenView } from './views/KitchenView';
import { DiscoverView } from './views/DiscoverView';
import { CookbookView } from './views/CookbookView';
import { CookingView } from './views/CookingView';
import { CookingStepsView } from './views/CookingStepsView';
import { BottomNav } from './components/BottomNav';
import { FilterSheet } from './components/FilterSheet';
import { RecipeDetail } from './components/RecipeDetail';
import { DEFAULT_FILTERS } from './data/defaults';
import type { ViewId, Filters, ApplianceTag, Recipe } from './types';

export default function App() {
  const [view, setView] = useState<ViewId>('kitchen');
  const [pantry, setPantry] = useStorage<string[]>('pantry', []);
  const [filters, setFilters] = useStorage<Filters>('filters', DEFAULT_FILTERS);
  const [cookbook, setCookbook] = useStorage<number[]>('cookbook', []);
  const [making, setMaking] = useStorage<number[]>('making', []);
  const [appliances, setAppliances] = useStorage<ApplianceTag[]>('appliances', []);
  const [passed, setPassed] = useStorage<number[]>('passed', []);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [cooked, setCooked] = useStorage<number[]>('cooked', []);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cookingSessionId, setCookingSessionId] = useState<number | null>(null);

  const addAiRecipe = (r: Recipe) => setAiRecipes((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
  const addToCooked = (id: number) => setCooked((p) => (p.includes(id) ? p : [id, ...p].slice(0, 100)));

  const addToCookbook = (id: number) => setCookbook((p) => (p.includes(id) ? p : [...p, id]));
  const removeFromCookbook = (id: number) => setCookbook((p) => p.filter((x) => x !== id));
  const addToMaking = (id: number) => setMaking((p) => (p.includes(id) ? p : [...p, id]));
  const removeFromMaking = (id: number) => setMaking((p) => p.filter((x) => x !== id));
  const addToPassed = (id: number) => setPassed((p) => {
    if (p.includes(id)) return p;
    const next = [...p, id];
    return next.length > 500 ? next.slice(-500) : next;
  });
  const resetPassed = () => setPassed(() => []);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(180deg, var(--bg-page) 0%, var(--bg-soft) 100%)' }}
    >
      <div
        className="max-w-[480px] mx-auto min-h-screen flex flex-col relative font-body"
        style={{ background: 'var(--bg-page)' }}
      >
        {/* Brand header */}
        <header className="px-6 pt-7 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl bg-[var(--brand-500)] flex items-center justify-center"
              style={{ boxShadow: '0 6px 14px -3px rgba(var(--brand-rgb),0.5)' }}
            >
              <ChefHat size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold text-[var(--text-primary)] text-[18px] leading-none tracking-tight">
                Easy Peasy
              </p>
              <p className="font-display italic text-[var(--brand-500)] text-[14px] leading-none -mt-0.5">
                Recipe-sy
              </p>
            </div>
          </div>
          {pantry.length > 0 && view !== 'kitchen' && (
            <button
              onClick={() => setView('kitchen')}
              className="text-[12px] font-body font-medium text-[var(--text-tertiary)] underline underline-offset-2"
            >
              {pantry.length} ingredients
            </button>
          )}
        </header>

        {view === 'kitchen' && (
          <KitchenView
            pantry={pantry}
            setPantry={setPantry}
            appliances={appliances}
            setAppliances={setAppliances}
            onContinue={() => setView('discover')}
          />
        )}
        {view === 'discover' && (
          <DiscoverView
            pantry={pantry}
            filters={filters}
            appliances={appliances}
            cookbook={cookbook}
            addToCookbook={addToCookbook}
            making={making}
            addToMaking={addToMaking}
            passed={passed}
            addToPassed={addToPassed}
            resetPassed={resetPassed}
            onOpenFilters={() => setShowFilters(true)}
            openDetail={(id) => setDetailId(id)}
            onCookNow={(id) => setCookingSessionId(id)}
            onAiGenerated={addAiRecipe}
          />
        )}
        {view === 'cookbook' && (
          <CookbookView
            cookbook={cookbook}
            pantry={pantry}
            removeFromCookbook={removeFromCookbook}
            openDetail={(id) => setDetailId(id)}
            onCookNow={(id) => { addToMaking(id); setCookingSessionId(id); }}
          />
        )}
        {view === 'making' && (
          <CookingView
            making={making}
            cooked={cooked}
            pantry={pantry}
            cookbook={cookbook}
            removeFromMaking={removeFromMaking}
            addToCookbook={addToCookbook}
            openDetail={(id) => setDetailId(id)}
            onCookNow={(id) => setCookingSessionId(id)}
          />
        )}

        <BottomNav
          view={view}
          setView={setView}
          cookbookCount={cookbook.length}
          makingCount={making.length}
        />

        <AnimatePresence>
          {showFilters && (
            <FilterSheet
              onClose={() => setShowFilters(false)}
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </AnimatePresence>

        {detailId !== null && (
          <RecipeDetail
            recipeId={detailId}
            onClose={() => setDetailId(null)}
            pantry={pantry}
            cookbook={cookbook}
            making={making}
            addToCookbook={addToCookbook}
            addToMaking={addToMaking}
            removeFromCookbook={removeFromCookbook}
            removeFromMaking={removeFromMaking}
            extraRecipes={aiRecipes}
          />
        )}

        <AnimatePresence>
          {cookingSessionId !== null && (
            <CookingStepsView
              recipeId={cookingSessionId}
              onClose={() => setCookingSessionId(null)}
              onDone={() => {
                addToCooked(cookingSessionId);
                removeFromMaking(cookingSessionId);
                setCookingSessionId(null);
              }}
              extraRecipes={aiRecipes}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
