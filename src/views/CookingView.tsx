import { RecipeGrid } from '../components/GridCard';

interface CookingViewProps {
  making: number[];
  pantry: string[];
  cookbook: number[];
  removeFromMaking: (id: number) => void;
  addToCookbook: (id: number) => void;
  openDetail: (id: number) => void;
}

export function CookingView({ making, pantry, cookbook, removeFromMaking, addToCookbook, openDetail }: CookingViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2 pb-4">
        <p className="font-body text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-semibold">
          Ready to cook
        </p>
        <h1 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight">
          Cooking Up
        </h1>
      </div>
      <RecipeGrid
        recipeIds={making}
        openDetail={openDetail}
        pantry={pantry}
        onRemove={removeFromMaking}
        removeLabel="Remove from cooking list"
        onSave={addToCookbook}
        savedIds={cookbook}
        emptyEmoji="🔥"
        emptyTitle="Nothing cooking yet"
        emptyDesc="Swipe right (or tap the heart) on recipes you want to make."
      />
    </div>
  );
}
