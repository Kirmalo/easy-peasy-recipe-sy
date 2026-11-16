import { ALLERGEN_LABELS, detectAllergens } from '../lib/allergens';
import type { Recipe } from '../types';

/** "Contains" badges derived from the ingredient list. */
export function AllergenList({ recipe }: { recipe: Recipe }) {
  const allergens = detectAllergens(recipe);
  return (
    <div className="mb-7">
      <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] mb-3">Allergens</h2>
      {allergens.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Contains">
          {allergens.map((a) => (
            <li key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[13px] font-semibold"
              style={{ background: 'var(--surface-cream)', color: 'var(--text-primary)' }}>
              <span aria-hidden="true">{ALLERGEN_LABELS[a].icon}</span>
              {ALLERGEN_LABELS[a].label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-[14px] text-[var(--text-secondary)]">None of the common allergens detected.</p>
      )}
      <p className="font-body text-[11px] text-[var(--text-tertiary)] mt-2 leading-snug">
        Detected from the ingredient names — always check product labels if you have an allergy.
      </p>
    </div>
  );
}
