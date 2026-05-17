import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShoppingCart } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { computeMatch } from '../lib/matching';
import { amazonItemUrl } from '../lib/affiliate';
import type { Recipe } from '../types';

interface ShoppingListSheetProps {
  cookbook: number[];
  making: number[];
  pantry: string[];
  onClose: () => void;
}

export function ShoppingListSheet({ cookbook, making, pantry, onClose }: ShoppingListSheetProps) {
  const [copied, setCopied] = useState(false);

  const allIds = [...new Set([...cookbook, ...making])];
  const recipes = allIds
    .map((id) => RECIPES.find((r) => r.id === id))
    .filter((r): r is Recipe => r !== undefined);

  // Dedupe missing ingredients; track which recipes need each one
  const missingMap = new Map<string, string[]>();
  recipes.forEach((recipe) => {
    computeMatch(recipe, pantry).missing.forEach((ing) => {
      if (!missingMap.has(ing)) missingMap.set(ing, []);
      missingMap.get(ing)!.push(recipe.name);
    });
  });

  const items = [...missingMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  const handleShare = async () => {
    const text = `Shopping list:\n${items.map(([ing]) => `• ${ing}`).join('\n')}`;
    if (navigator.share) {
      await navigator.share({ title: 'Shopping List', text }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative max-w-[480px] w-full mx-auto bg-[var(--bg-page)] rounded-t-[32px] flex flex-col"
        style={{ maxHeight: '85vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[24px] leading-tight">
              Shopping List
            </h2>
            <p className="font-body text-[var(--text-tertiary)] text-[13px] mt-0.5">
              {recipes.length === 0
                ? 'No recipes saved yet'
                : items.length === 0
                ? `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} — fully stocked!`
                : `${items.length} item${items.length !== 1 ? 's' : ''} across ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {items.length > 0 && (
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-full font-body text-[13px] font-semibold active:scale-95 transition-all"
                style={{
                  background: copied ? 'var(--success-100)' : 'var(--surface-cream)',
                  color: copied ? 'var(--success-700)' : 'var(--text-primary)',
                }}
              >
                {copied ? 'Copied!' : typeof navigator.share === 'function' ? 'Share' : 'Copy'}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--surface-muted)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={16} strokeWidth={2.5} className="text-[var(--text-primary)]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto no-scrollbar px-6 pb-10 flex-1">
          {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">
                <ShoppingCart size={56} strokeWidth={1.2} className="text-[var(--border-default)]" />
              </div>
              <p className="font-body text-[var(--text-secondary)] text-[15px] leading-relaxed">
                Save recipes to your cookbook and we'll track what you need to buy.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="font-display font-semibold text-[var(--text-primary)] text-[22px] mb-2">
                You're all set!
              </h3>
              <p className="font-body text-[var(--text-secondary)] text-[15px]">
                Your pantry covers everything in your cookbook.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 16px -4px rgba(var(--ink-warm-rgb),0.10)' }}>
              {items.map(([ing, fromRecipes], i) => (
                <div
                  key={ing}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[15px] text-[var(--text-primary)] capitalize font-medium">
                      {ing}
                    </p>
                    <p className="font-body text-[11px] text-[var(--text-tertiary)] truncate">
                      {fromRecipes.join(' · ')}
                    </p>
                  </div>
                  <a
                    href={amazonItemUrl(ing)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-3 py-1.5 rounded-full font-body text-[12px] font-bold active:scale-95 transition-transform"
                    style={{ background: '#FF9900', color: 'white' }}
                  >
                    Buy →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
