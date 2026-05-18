import { useState, useMemo } from 'react';
import { X, BookmarkPlus, Heart, SlidersHorizontal, Sparkles, RotateCcw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from '../components/SwipeCard';
import { IconButton } from '../components/IconButton';
import { AIRecipeSheet } from '../components/AIRecipeSheet';
import { RECIPES } from '../data/recipes';
import { computeMatch, isStaple } from '../lib/matching';
import { inferCuisine } from '../lib/cuisine';
import type { Filters, SwipeDirection, ApplianceTag, Recipe } from '../types';

interface DiscoverViewProps {
  pantry: string[];
  filters: Filters;
  appliances: ApplianceTag[];
  cookbook: number[];
  addToCookbook: (id: number) => void;
  making: number[];
  addToMaking: (id: number) => void;
  passed: number[];
  addToPassed: (id: number) => void;
  resetPassed: () => void;
  onOpenFilters: () => void;
  openDetail: (id: number) => void;
  onCookNow: (id: number) => void;
  onAiGenerated: (recipe: Recipe) => void;
}

export function DiscoverView({
  pantry,
  filters,
  appliances,
  cookbook,
  addToCookbook,
  making,
  addToMaking,
  passed,
  addToPassed,
  resetPassed,
  onOpenFilters,
  openDetail,
  onCookNow,
  onAiGenerated,
}: DiscoverViewProps) {
  const [forcedExit, setForcedExit] = useState<SwipeDirection | null>(null);
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRecipe, setAiRecipe] = useState<Recipe | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const generateRecipe = async () => {
    if (pantry.length === 0) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantry, appliances, servings: 4 }),
      });
      const data = await res.json() as { error?: string } & Recipe;
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setAiRecipe(data as Recipe);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAiGenerating(false);
    }
  };

  const unfilteredCount = useMemo(
    () => RECIPES.filter((r) => !passed.includes(r.id) && !cookbook.includes(r.id) && !making.includes(r.id)).length,
    [passed, cookbook, making],
  );

  const deck = useMemo(() => {
    let candidates = RECIPES.filter(
      (r) => !passed.includes(r.id) && !cookbook.includes(r.id) && !making.includes(r.id),
    );
    if (filters.cookTime) candidates = candidates.filter((r) => r.cookTime <= filters.cookTime!);
    if (filters.difficulty) candidates = candidates.filter((r) => r.difficulty === filters.difficulty);
    if (filters.mealType) candidates = candidates.filter((r) => r.mealType === filters.mealType);
    if (filters.dietary?.length) {
      candidates = candidates.filter((r) => filters.dietary.every((d) => r.dietary.includes(d)));
    }

    if (appliances.length > 0) {
      candidates = candidates.filter((r) =>
        !r.appliances?.length || r.appliances.every((a) => appliances.includes(a))
      );
    }

    if (filters.cuisine) {
      candidates = candidates.filter((r) => inferCuisine(r) === filters.cuisine);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      candidates = candidates.filter(
        (r) => r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q)),
      );
    }

    let scored = candidates.map((r) => ({ recipe: r, match: computeMatch(r, pantry) }));

    const mode = filters.ingredientMode ?? 'all';
    if (pantry.length > 0 && mode !== 'all') {
      scored = scored.filter(({ match }) => {
        const missing = match.missing;
        if (mode === 'strict') return missing.length === 0;
        const n = mode === 'flex1' ? 1 : mode === 'flex2' ? 2 : 3;
        return missing.length <= n && missing.every((m) => isStaple(m));
      });
    }

    scored.sort((a, b) => b.match.score - a.match.score);
    return scored;
  }, [pantry, filters, appliances, cookbook, making, passed, searchQuery]);

  const topThree = deck.slice(0, 3);
  const current = topThree[0];

  const handleSwipe = (dir: SwipeDirection) => {
    if (!current) return;
    if (dir === 'right') {
      addToMaking(current.recipe.id);
      onCookNow(current.recipe.id);
    } else {
      addToPassed(current.recipe.id);
    }
    setForcedExit(null);
    setExitingId(null);
  };

  const triggerSwipe = (dir: SwipeDirection) => {
    if (!current || exitingId !== null) return;
    setExitingId(current.recipe.id);
    setForcedExit(dir);
  };

  const handleSave = () => {
    if (!current) return;
    addToCookbook(current.recipe.id);
  };

  const ingredientMode = filters.ingredientMode ?? 'all';
  const activeFilterCount =
    (filters.cookTime ? 1 : 0) +
    (filters.difficulty ? 1 : 0) +
    (filters.mealType ? 1 : 0) +
    (filters.dietary?.length ?? 0) +
    (ingredientMode !== 'all' ? 1 : 0);

  const modeBadge =
    pantry.length > 0 && ingredientMode !== 'all'
      ? ingredientMode === 'strict' ? 'Exact match'
        : ingredientMode === 'flex1' ? '+1 staple OK'
        : ingredientMode === 'flex2' ? '+2 staples OK'
        : '+3 staples OK'
      : null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Filter bar */}
      <div className="px-6 pt-2 pb-3">
        <AnimatePresence initial={false} mode="wait">
          {showSearch ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 relative">
                <Search size={16} strokeWidth={2.4} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes or ingredients…"
                  className="w-full pl-9 pr-4 py-3 rounded-2xl font-body text-[15px] bg-white border-2 border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)]"
                  style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.10)' }}
                />
              </div>
              <button
                onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                className="h-12 w-12 rounded-full bg-white border-2 border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
              >
                <X size={18} className="text-[var(--text-primary)]" strokeWidth={2.4} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-semibold">
                  {pantry.length > 0
                    ? `Matched to ${pantry.length} ingredient${pantry.length === 1 ? '' : 's'}`
                    : 'Browsing everything'}
                </p>
                <h1 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight">
                  Discover
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {modeBadge && (
                    <button
                      onClick={onOpenFilters}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--brand-50)] active:scale-95 transition-transform"
                    >
                      <Sparkles size={11} strokeWidth={2.8} className="text-[var(--brand-500)]" />
                      <span className="font-body text-[11px] font-bold text-[var(--brand-800)]">{modeBadge}</span>
                    </button>
                  )}
                  {passed.length > 0 && (
                    <button
                      onClick={resetPassed}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] active:scale-95 transition-transform"
                    >
                      <RotateCcw size={11} strokeWidth={2.8} className="text-[var(--text-tertiary)]" />
                      <span className="font-body text-[11px] font-bold text-[var(--text-tertiary)]">{passed.length} seen</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowSearch(true)}
                  className="h-12 w-12 rounded-full bg-white border-2 border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform"
                  style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.15)' }}
                >
                  <Search size={20} className="text-[var(--text-primary)]" strokeWidth={2.4} />
                </button>
                <button
                  onClick={onOpenFilters}
                  className="relative h-12 w-12 rounded-full bg-white border-2 border-[var(--border-default)] flex items-center justify-center active:scale-95 transition-transform"
                  style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.15)' }}
                >
                  <SlidersHorizontal size={20} className="text-[var(--text-primary)]" strokeWidth={2.4} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--brand-500)] text-white text-[11px] font-bold flex items-center justify-center font-body">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-6">
        {current ? (
          <>
            <div className="relative w-full" style={{ aspectRatio: '3 / 4.2', maxHeight: '60vh' }}>
              {topThree.slice().reverse().map((item, revIdx) => {
                const stackIdx = topThree.length - 1 - revIdx;
                return (
                  <SwipeCard
                    key={item.recipe.id}
                    recipe={item.recipe}
                    match={item.match}
                    isTop={stackIdx === 0}
                    stackIndex={stackIdx}
                    onSwipe={handleSwipe}
                    onTap={() => openDetail(item.recipe.id)}
                    forcedExit={stackIdx === 0 && exitingId === item.recipe.id ? forcedExit : null}
                  />
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-5 mt-7 mb-2">
              <IconButton
                icon={X}
                onClick={() => triggerSwipe('left')}
                label="Pass"
                bg="white"
                color="var(--brand-500)"
                size={60}
                ring="rgba(var(--brand-rgb),0.28)"
              />
              <IconButton
                icon={BookmarkPlus}
                onClick={handleSave}
                label="Save to cookbook"
                bg="white"
                color="var(--accent-500)"
                size={50}
                ring="rgba(var(--accent-rgb),0.32)"
              />
              <IconButton
                icon={Heart}
                onClick={() => triggerSwipe('right')}
                label="I'll make it"
                bg="var(--brand-500)"
                color="white"
                size={68}
                ring="rgba(var(--brand-rgb),0.18)"
              />
            </div>
            <div className="flex items-center justify-center gap-5 mt-2 px-4">
              <p className="font-body text-[11px] text-[var(--text-tertiary)] text-center w-16">Pass</p>
              <p className="font-body text-[11px] text-[var(--text-tertiary)] text-center w-14">Save</p>
              <p className="font-body text-[11px] text-[var(--text-tertiary)] text-center w-16">Cook it</p>
            </div>

            {/* AI generate button */}
            <div className="flex flex-col items-center mt-4 gap-2">
              <button
                onClick={generateRecipe}
                disabled={aiGenerating || pantry.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-body text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
                style={{
                  background: 'var(--surface-cream)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 2px 8px -2px rgba(var(--ink-warm-rgb),0.10)',
                }}
              >
                <span style={{ display: 'inline-block', animation: aiGenerating ? 'spin 1s linear infinite' : 'none' }}>✨</span>
                {aiGenerating ? 'Generating…' : pantry.length === 0 ? 'Add ingredients to generate' : 'Generate a recipe from my pantry'}
              </button>
              {aiError && (
                <p className="font-body text-[12px] text-red-500 text-center px-6">{aiError}</p>
              )}
            </div>
          </>
        ) : unfilteredCount > 0 ? (
          <div className="text-center py-16" style={{ animation: 'float-in 0.5s ease-out' }}>
            <div className="text-7xl mb-5">🔍</div>
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight mb-3">
              No matches
            </h2>
            <p className="font-body text-[var(--text-secondary)] text-[15px] mb-6 px-6">
              {searchQuery.trim()
                ? 'No recipes found for that search. Try different words.'
                : 'Your current filters are hiding everything. Loosen them up!'}
            </p>
            <div className="flex flex-col gap-3 px-6">
              <button
                onClick={onOpenFilters}
                className="px-6 py-3.5 rounded-2xl bg-[var(--surface-dark)] text-white font-body font-bold text-[15px] active:scale-95 transition-transform"
              >
                Adjust filters
              </button>
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3.5 rounded-2xl bg-white border-2 border-[var(--border-default)] text-[var(--text-primary)] font-body font-bold text-[15px] active:scale-95 transition-transform"
                  style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.12)' }}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16" style={{ animation: 'float-in 0.5s ease-out' }}>
            <div className="text-7xl mb-5">🌟</div>
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight mb-3">
              You've seen it all!
            </h2>
            <p className="font-body text-[var(--text-secondary)] text-[15px] mb-6 px-6">
              You've been through every recipe. Ready to go again?
            </p>
            <div className="flex flex-col gap-3 px-6">
              <button
                onClick={resetPassed}
                className="px-6 py-3.5 rounded-2xl bg-[var(--surface-dark)] text-white font-body font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} strokeWidth={2.5} />
                Start over
              </button>
              {pantry.length > 0 && (
                <button
                  onClick={generateRecipe}
                  disabled={aiGenerating}
                  className="px-6 py-3.5 rounded-2xl font-body font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'var(--surface-cream)', color: 'var(--text-primary)' }}
                >
                  <span>✨</span>
                  {aiGenerating ? 'Generating…' : 'Generate a recipe with AI'}
                </button>
              )}
            </div>
            {aiError && (
              <p className="font-body text-[12px] text-red-500 text-center mt-3 px-6">{aiError}</p>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {aiRecipe && (
          <AIRecipeSheet
            recipe={aiRecipe}
            pantry={pantry}
            onDismiss={() => setAiRecipe(null)}
            onSave={(r) => {
              onAiGenerated(r);
              addToCookbook(r.id);
              setAiRecipe(null);
            }}
            onCook={(r) => {
              onAiGenerated(r);
              addToMaking(r.id);
              onCookNow(r.id);
              setAiRecipe(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
