import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { RecipeGrid } from '../components/GridCard';
import { ShoppingListSheet } from '../components/ShoppingListSheet';

interface CookbookViewProps {
  cookbook: number[];
  making: number[];
  pantry: string[];
  ratings: Record<number, 1 | 2 | 3>;
  removeFromCookbook: (id: number) => void;
  openDetail: (id: number) => void;
  onCookNow: (id: number) => void;
  onRate: (id: number, stars: 1 | 2 | 3) => void;
}

export function CookbookView({ cookbook, making, pantry, ratings, removeFromCookbook, openDetail, onCookNow, onRate }: CookbookViewProps) {
  const [showShoppingList, setShowShoppingList] = useState(false);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2 pb-4">
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
      </div>
      <RecipeGrid
        recipeIds={cookbook}
        openDetail={openDetail}
        pantry={pantry}
        onRemove={removeFromCookbook}
        removeLabel="Remove from cookbook"
        onCook={onCookNow}
        ratings={ratings}
        onRate={onRate}
        emptyEmoji="📖"
        emptyTitle="Your cookbook is empty"
        emptyDesc="Tap the bookmark icon on any recipe to save it here for later."
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
