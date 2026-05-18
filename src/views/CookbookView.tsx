import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, X } from 'lucide-react';
import { RecipeGrid } from '../components/GridCard';
import { ShoppingListSheet } from '../components/ShoppingListSheet';
import { RECIPES } from '../data/recipes';

interface CookbookViewProps {
  cookbook: number[];
  making: number[];
  pantry: string[];
  ratings: Record<number, 1 | 2 | 3>;
  notes: Record<number, string>;
  removeFromCookbook: (id: number) => void;
  openDetail: (id: number) => void;
  onCookNow: (id: number) => void;
  onRate: (id: number, stars: 1 | 2 | 3) => void;
}

export function CookbookView({ cookbook, making, pantry, ratings, notes, removeFromCookbook, openDetail, onCookNow, onRate }: CookbookViewProps) {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topRatedOnly, setTopRatedOnly] = useState(false);

  const hasFilter = searchQuery.trim().length > 0 || topRatedOnly;

  const filteredCookbook = hasFilter
    ? cookbook.filter((id) => {
        const recipe = RECIPES.find((r) => r.id === id);
        if (!recipe) return false;
        if (searchQuery.trim() && !recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (topRatedOnly && ratings[id] !== 3) return false;
        return true;
      })
    : cookbook;

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2 pb-3">
        <p className="font-body text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-semibold">
          Saved for later
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight">
            My Cookbook
          </h1>
          <button
            onClick={() => setShowShoppingList(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-body text-[13px] font-semibold active:scale-95 transition-transform"
            style={{ background: 'var(--surface-cream)', color: 'var(--text-primary)' }}
          >
            <ShoppingCart size={14} strokeWidth={2.5} />
            Shop
          </button>
        </div>

        {/* Search + filter row */}
        {cookbook.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={15} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="w-full pl-9 pr-8 py-2 rounded-full font-body text-[14px] bg-white border-2 border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90"
                >
                  <X size={14} strokeWidth={2.5} className="text-[var(--text-tertiary)]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setTopRatedOnly((v) => !v)}
              className="flex-shrink-0 px-3 py-2 rounded-full font-body text-[13px] font-bold active:scale-95 transition-all"
              style={{
                background: topRatedOnly ? 'var(--accent-500)' : 'white',
                color: topRatedOnly ? 'white' : 'var(--text-secondary)',
                border: `2px solid ${topRatedOnly ? 'var(--accent-500)' : 'var(--border-default)'}`,
              }}
            >
              🤩 only
            </button>
          </div>
        )}
      </div>

      <RecipeGrid
        recipeIds={filteredCookbook}
        openDetail={openDetail}
        pantry={pantry}
        onRemove={removeFromCookbook}
        removeLabel="Remove from cookbook"
        onCook={onCookNow}
        ratings={ratings}
        onRate={onRate}
        notes={notes}
        emptyEmoji={hasFilter ? '🔍' : '📖'}
        emptyTitle={hasFilter ? 'No matches' : 'Your cookbook is empty'}
        emptyDesc={
          hasFilter
            ? 'Try a different search or clear the filter.'
            : 'Tap the bookmark icon on any recipe to save it here for later.'
        }
      />

      <AnimatePresence>
        {showShoppingList && (
          <ShoppingListSheet
            cookbook={cookbook}
            making={making}
            pantry={pantry}
            onClose={() => setShowShoppingList(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
