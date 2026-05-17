import { useState } from 'react';
import { ArrowLeft, Clock, Gauge, Utensils, Leaf, BookOpen, Flame, Check, ShoppingCart, Minus, Plus, Share2 } from 'lucide-react';
import { Pill } from './Pill';
import { THEMES } from '../data/themes';
import { RECIPES, CUISINE_LABELS } from '../data/recipes';
import { computeMatch, ingMatches } from '../lib/matching';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { amazonItemUrl, getEquipmentSuggestions, AMAZON_TAG } from '../lib/affiliate';
import { scaleAmount } from '../lib/scaleAmount';

interface RecipeDetailProps {
  recipeId: number;
  onClose: () => void;
  pantry: string[];
  cookbook: number[];
  making: number[];
  addToCookbook: (id: number) => void;
  addToMaking: (id: number) => void;
  removeFromCookbook: (id: number) => void;
  removeFromMaking: (id: number) => void;
  addToPantry?: (ing: string) => void;
  extraRecipes?: import('../types').Recipe[];
}


async function shareShoppingList(missing: string[], recipeName: string) {
  const text = `Shopping list for ${recipeName}:\n${missing.map((m) => `• ${m}`).join('\n')}`;
  if (navigator.share) {
    await navigator.share({ title: `${recipeName} — shopping list`, text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export function RecipeDetail({
  recipeId,
  onClose,
  pantry,
  cookbook,
  making,
  addToCookbook,
  addToMaking,
  removeFromCookbook,
  removeFromMaking,
  addToPantry,
  extraRecipes,
}: RecipeDetailProps) {
  const recipe = [...(extraRecipes ?? []), ...RECIPES].find((r) => r.id === recipeId);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [servings, setServings] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!recipe) return null;

  const theme = THEMES[recipe.theme];
  const match = computeMatch(recipe, pantry);
  const inCookbook = cookbook.includes(recipe.id);
  const inMaking = making.includes(recipe.id);
  const imageUrl = useRecipeImage(recipe.id, recipe.name);
  const showFallback = !imageUrl || imgError || !imgLoaded;

  const activeServings = servings ?? recipe.servings;
  const scaleFactor = activeServings / recipe.servings;

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg-page)] overflow-y-auto no-scrollbar"
      style={{ animation: 'float-in 0.3s ease-out' }}
    >
      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${showFallback ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)` }}
        >
          <div className="absolute inset-0 grain opacity-30" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full" style={{ background: 'rgba(0,0,0,0.10)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[180px] leading-none" style={{ filter: 'drop-shadow(0 12px 25px rgba(0,0,0,0.25))' }}>
              {recipe.emoji}
            </div>
          </div>
        </div>

        {imageUrl && !imgError && (
          <img
            src={imageUrl}
            alt={recipe.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(251,248,241,0.95) 100%)' }}
        />

        <button
          onClick={onClose}
          aria-label="Back"
          className="absolute top-5 left-5 w-11 h-11 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[var(--text-primary)] active:scale-90 transition-transform z-10 shadow-lg"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>

        <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
          <button
            onClick={async () => {
              const text = `${recipe.name}\n\n${recipe.description}\n\nIngredients:\n${recipe.ingredients.map((ing, i) => `• ${recipe.amounts[i]} ${ing}`).join('\n')}`;
              if (typeof navigator.share === 'function') {
                await navigator.share({ title: recipe.name, text }).catch(() => undefined);
              } else {
                await navigator.clipboard.writeText(text);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
              }
            }}
            aria-label="Share recipe"
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform shadow-lg"
          >
            {shared
              ? <Check size={18} strokeWidth={2.8} className="text-[var(--success-500)]" />
              : <Share2 size={18} strokeWidth={2.5} className="text-[var(--text-primary)]" />}
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center text-[30px] shadow-lg">
            {recipe.emoji}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 pb-48 -mt-6 relative bg-[var(--bg-page)] rounded-t-[32px]">
        <h1 className="font-display font-semibold text-[var(--text-primary)] text-[36px] leading-[1.05] tracking-tight mb-2">
          {recipe.name}
        </h1>
        <p className="font-body text-[var(--text-secondary)] text-[16px] leading-relaxed mb-5">
          {recipe.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-7">
          <Pill icon={Clock} color="var(--surface-cream)" textColor="var(--text-primary)">{recipe.cookTime} min</Pill>
          <Pill icon={Gauge} color="var(--surface-cream)" textColor="var(--text-primary)">{CUISINE_LABELS[recipe.difficulty]}</Pill>
          <Pill icon={Utensils} color="var(--surface-cream)" textColor="var(--text-primary)">{CUISINE_LABELS[recipe.mealType]}</Pill>
          <div
            className="inline-flex items-center gap-1 px-1 py-1 rounded-full"
            style={{ background: 'var(--surface-cream)' }}
          >
            <button
              onClick={() => setServings((s) => Math.max(1, (s ?? recipe.servings) - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: activeServings > 1 ? 'var(--surface-dark)' : 'var(--border-default)' }}
              disabled={activeServings <= 1}
            >
              <Minus size={12} strokeWidth={3} className="text-white" />
            </button>
            <span className="font-body text-[13px] font-semibold text-[var(--text-primary)] px-1.5 tabular-nums">
              {activeServings} {activeServings === 1 ? 'serving' : 'servings'}
            </span>
            <button
              onClick={() => setServings((s) => (s ?? recipe.servings) + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'var(--surface-dark)' }}
            >
              <Plus size={12} strokeWidth={3} className="text-white" />
            </button>
          </div>
          {recipe.dietary.map((d) => (
            <Pill key={d} icon={Leaf} color={theme.soft} textColor={theme.dark}>{d}</Pill>
          ))}
        </div>

        {/* Ingredients */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] flex items-center gap-2">
              Ingredients
              {pantry.length > 0 && (
                <span className="font-body font-medium text-[13px] text-[var(--text-tertiary)]">
                  · {match.have}/{match.need} in pantry
                </span>
              )}
            </h2>
            {match.missing.length > 0 && (
              <button
                onClick={async () => {
                  await shareShoppingList(match.missing, recipe.name);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full font-body text-[12px] font-semibold active:scale-95 transition-all"
                style={{
                  background: copied ? 'var(--success-100)' : theme.soft,
                  color: copied ? 'var(--success-700)' : theme.dark,
                }}
              >
                <ShoppingCart size={13} strokeWidth={2.5} />
                {copied ? 'Copied!' : `${match.missing.length} to buy`}
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl p-2">
            {recipe.ingredients.map((ing, i) => {
              const have = pantry.some((p) => ingMatches(ing, p));
              return (
                <div key={ing} className="flex items-center gap-3 px-3 py-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: have ? theme.from : 'var(--surface-muted)' }}
                  >
                    {have && <Check size={14} strokeWidth={3.5} className="text-white" />}
                  </div>
                  <span className="font-body text-[15px] text-[var(--text-primary)] capitalize flex-1">{ing}</span>
                  {have ? (
                    <span className="font-body text-[13px] text-[var(--text-tertiary)] tabular-nums">
                      {scaleAmount(recipe.amounts[i], scaleFactor)}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-body text-[13px] text-[var(--text-tertiary)] tabular-nums">
                        {scaleAmount(recipe.amounts[i], scaleFactor)}
                      </span>
                      {addToPantry && (
                        <button
                          onClick={() => addToPantry(ing)}
                          className="px-2 py-1 rounded-full font-body text-[11px] font-bold active:scale-95 transition-transform"
                          style={{ background: 'var(--success-100)', color: 'var(--success-700)' }}
                        >
                          + Pantry
                        </button>
                      )}
                      <a
                        href={amazonItemUrl(ing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-full font-body text-[11px] font-bold active:scale-95 transition-transform"
                        style={{ background: '#FF9900', color: 'white' }}
                      >
                        Buy →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] mb-4">Method</h2>
          <div className="space-y-3">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-2xl p-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[15px]"
                  style={{ background: theme.from, color: 'white' }}
                >
                  {i + 1}
                </div>
                <p className="font-body text-[15px] text-[var(--text-primary)] leading-relaxed flex-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipment suggestions */}
      {(() => {
        const gear = getEquipmentSuggestions(recipe);
        return (
          <div className="mb-8">
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] mb-3">
              Useful kit
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {gear.map((item) => (
                <a
                  key={item.name}
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(item.query)}&tag=${AMAZON_TAG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 bg-white rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  style={{
                    minWidth: 110,
                    boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.12)',
                    border: '1.5px solid var(--border-default)',
                  }}
                >
                  <span className="text-[32px]">{item.emoji}</span>
                  <span className="font-body text-[12px] font-semibold text-[var(--text-primary)] text-center leading-snug">{item.name}</span>
                  <span className="font-body text-[10px] text-[var(--brand-500)] font-bold">Amazon →</span>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Sticky actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-[var(--bg-page)]/95 backdrop-blur-md p-5 pb-7 border-t border-[var(--border-default)]">
        <div className="flex gap-3">
          <button
            onClick={() => inCookbook ? removeFromCookbook(recipe.id) : addToCookbook(recipe.id)}
            className="flex-1 py-3.5 rounded-2xl font-body font-bold text-[15px] active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{
              background: inCookbook ? theme.dark : 'white',
              color: inCookbook ? 'white' : 'var(--text-primary)',
              border: inCookbook ? 'none' : '2px solid var(--border-default)',
              boxShadow: inCookbook ? 'none' : '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.15)',
            }}
          >
            <BookOpen size={18} strokeWidth={2.5} />
            {inCookbook ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => inMaking ? removeFromMaking(recipe.id) : addToMaking(recipe.id)}
            className="flex-1 py-3.5 rounded-2xl font-body font-bold text-[15px] text-white active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ background: inMaking ? 'var(--surface-dark)' : theme.from }}
          >
            <Flame size={18} strokeWidth={2.5} />
            {inMaking ? 'Cooking!' : "Let's cook"}
          </button>
        </div>
      </div>
    </div>
  );
}
