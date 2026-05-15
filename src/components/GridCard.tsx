import { useState } from 'react';
import { X, Clock, Sparkles, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { THEMES } from '../data/themes';
import { RECIPES } from '../data/recipes';
import { computeMatch } from '../lib/matching';
import { useRecipeImage } from '../hooks/useRecipeImage';
import type { Recipe } from '../types';

interface GridCardProps {
  recipe: Recipe;
  pantry: string[];
  onRemove?: (id: number) => void;
  removeLabel?: string;
  onSave?: (id: number) => void;
  saved?: boolean;
  openDetail: (id: number) => void;
  index: number;
}

export function GridCard({ recipe, pantry, onRemove, removeLabel, onSave, saved, openDetail, index }: GridCardProps) {
  const theme = THEMES[recipe.theme];
  const m = computeMatch(recipe, pantry);
  const imageUrl = useRecipeImage(recipe.id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const showFallback = !imageUrl || imgError || !imgLoaded;

  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
      style={{
        background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)`,
        animation: `float-in 0.4s ease-out ${index * 0.05}s both`,
        aspectRatio: '0.78',
        boxShadow: '0 10px 24px -10px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.04)',
      }}
      onClick={() => openDetail(recipe.id)}
    >
      {/* Fallback */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${showFallback ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)` }}
      >
        <div className="absolute inset-0 grain opacity-25" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[80px]" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }}>
            {recipe.emoji}
          </div>
        </div>
      </div>

      {/* Photo */}
      {imageUrl && !imgError && (
        <img
          src={imageUrl}
          alt={recipe.name}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Dark bottom gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.75) 100%)' }}
      />

      {/* Emoji badge */}
      <div className="absolute top-2.5 left-2.5 w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center text-[18px] shadow-md">
        {recipe.emoji}
      </div>

      {(onRemove || onSave) && (
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!saved) onSave(recipe.id); }}
              aria-label={saved ? 'Saved to cookbook' : 'Save to cookbook'}
              className="w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
              style={{ background: saved ? 'rgba(var(--accent-rgb),0.85)' : 'rgba(0,0,0,0.40)' }}
            >
              {saved
                ? <BookmarkCheck size={15} strokeWidth={2.5} className="text-white" />
                : <BookmarkPlus size={15} strokeWidth={2.5} className="text-white" />}
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(recipe.id); }}
              aria-label={removeLabel}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90"
            >
              <X size={16} strokeWidth={2.8} />
            </button>
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <p
          className="font-display font-semibold text-white text-[16px] leading-[1.1] tracking-tight mb-1.5"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
        >
          {recipe.name}
        </p>
        <div
          className="flex items-center gap-1.5 text-white/95 font-body text-[11px] font-semibold"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          <Clock size={11} strokeWidth={2.6} />
          {recipe.cookTime}m
          {pantry.length > 0 && (
            <>
              <span>·</span>
              <Sparkles size={11} strokeWidth={2.6} />
              {m.have}/{m.need}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecipeGridProps {
  recipeIds: number[];
  openDetail: (id: number) => void;
  pantry: string[];
  onRemove?: (id: number) => void;
  removeLabel?: string;
  onSave?: (id: number) => void;
  savedIds?: number[];
  emptyTitle: string;
  emptyDesc: string;
  emptyEmoji: string;
}

export function RecipeGrid({
  recipeIds,
  openDetail,
  pantry,
  onRemove,
  removeLabel,
  onSave,
  savedIds,
  emptyTitle,
  emptyDesc,
  emptyEmoji,
}: RecipeGridProps) {
  const recipes = recipeIds.map((id) => RECIPES.find((r) => r.id === id)).filter((r): r is Recipe => r !== undefined);

  if (recipes.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center text-center px-10 pb-32"
        style={{ animation: 'float-in 0.5s ease-out' }}
      >
        <div className="text-7xl mb-5">{emptyEmoji}</div>
        <h2 className="font-display font-semibold text-[var(--text-primary)] text-[26px] leading-tight mb-3">
          {emptyTitle}
        </h2>
        <p className="font-body text-[var(--text-secondary)] text-[15px] leading-relaxed">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32">
      <div className="grid grid-cols-2 gap-4">
        {recipes.map((r, i) => (
          <GridCard
            key={r.id}
            recipe={r}
            pantry={pantry}
            onRemove={onRemove}
            removeLabel={removeLabel}
            onSave={onSave}
            saved={savedIds?.includes(r.id)}
            openDetail={openDetail}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
