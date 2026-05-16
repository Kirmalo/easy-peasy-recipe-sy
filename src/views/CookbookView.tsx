import { RecipeGrid } from '../components/GridCard';

interface CookbookViewProps {
  cookbook: number[];
  pantry: string[];
  ratings: Record<number, 1 | 2 | 3>;
  removeFromCookbook: (id: number) => void;
  openDetail: (id: number) => void;
  onCookNow: (id: number) => void;
  onRate: (id: number, stars: 1 | 2 | 3) => void;
}

export function CookbookView({ cookbook, pantry, ratings, removeFromCookbook, openDetail, onCookNow, onRate }: CookbookViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 pt-2 pb-4">
        <p className="font-body text-[12px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-semibold">
          Saved for later
        </p>
        <h1 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight">
          My Cookbook
        </h1>
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
    </div>
  );
}
