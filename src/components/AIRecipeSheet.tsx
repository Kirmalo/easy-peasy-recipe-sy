import { X, BookmarkPlus, Flame, Clock, Gauge, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Recipe } from '../types';
import { THEMES } from '../data/themes';
import { ingMatches } from '../lib/matching';

interface AIRecipeSheetProps {
  recipe: Recipe;
  pantry: string[];
  onDismiss: () => void;
  onSave: (recipe: Recipe) => void;
  onCook: (recipe: Recipe) => void;
}

export function AIRecipeSheet({ recipe, pantry, onDismiss, onSave, onCook }: AIRecipeSheetProps) {
  const theme = THEMES[recipe.theme];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ maxWidth: 480, margin: '0 auto', left: 0, right: 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

      <motion.div
        className="relative bg-[var(--bg-page)] rounded-t-[32px] overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Gradient header */}
        <div
          className="relative h-44 flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)` }}
        >
          <div className="absolute inset-0 grain opacity-20" />
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          />
          <div
            className="text-[90px] leading-none"
            style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}
          >
            {recipe.emoji}
          </div>

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={18} className="text-white" strokeWidth={2.5} />
          </button>

          <div
            className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
          >
            <span className="text-[11px]">✨</span>
            <span className="font-body text-[11px] font-bold text-white">AI Generated</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 pt-5 pb-3 no-scrollbar">
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-[28px] leading-tight tracking-tight mb-1">
            {recipe.name}
          </h2>
          <p className="font-body text-[var(--text-secondary)] text-[14px] leading-relaxed mb-4">
            {recipe.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[12px] font-semibold text-[var(--text-primary)]"
              style={{ background: 'var(--surface-cream)' }}
            >
              <Clock size={12} strokeWidth={2.5} /> {recipe.cookTime} min
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[12px] font-semibold text-[var(--text-primary)] capitalize"
              style={{ background: 'var(--surface-cream)' }}
            >
              <Gauge size={12} strokeWidth={2.5} /> {recipe.difficulty}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[12px] font-semibold text-[var(--text-primary)]"
              style={{ background: 'var(--surface-cream)' }}
            >
              Serves {recipe.servings}
            </span>
          </div>

          <h3 className="font-display font-semibold text-[var(--text-primary)] text-[16px] mb-2">
            Ingredients
          </h3>
          <div className="bg-white rounded-2xl p-2 mb-4">
            {recipe.ingredients.map((ing, i) => {
              const have = pantry.some((p) => ingMatches(ing, p));
              return (
                <div key={`${ing}-${i}`} className="flex items-center gap-3 px-3 py-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: have ? theme.from : 'var(--surface-muted)' }}
                  >
                    {have && <Check size={11} strokeWidth={3.5} className="text-white" />}
                  </div>
                  <span className="font-body text-[13px] text-[var(--text-primary)] capitalize flex-1">
                    {ing}
                  </span>
                  <span className="font-body text-[12px] text-[var(--text-tertiary)] tabular-nums">
                    {recipe.amounts[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-8 pt-3 flex gap-3 flex-shrink-0 border-t border-[var(--border-default)]">
          <button
            onClick={() => onSave(recipe)}
            className="flex-1 py-3.5 rounded-2xl font-body font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: 'white',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-default)',
            }}
          >
            <BookmarkPlus size={16} strokeWidth={2.5} />
            Save
          </button>
          <button
            onClick={() => onCook(recipe)}
            className="flex-1 py-3.5 rounded-2xl font-body font-bold text-[14px] text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: theme.from }}
          >
            <Flame size={16} strokeWidth={2.5} />
            Let's cook!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
