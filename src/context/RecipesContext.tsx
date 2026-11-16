import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { RecipesContext, makeRecipesValue } from './recipes';
import { CURATED_RECIPES, loadAllRecipes } from '../data/recipes';
import type { Recipe } from '../types';

export function RecipesProvider({ extra, children }: { extra: Recipe[]; children: ReactNode }) {
  const [catalog, setCatalog] = useState<Recipe[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllRecipes()
      .then((all) => { if (!cancelled) setCatalog(all); })
      .catch((err) => console.error('Failed to load recipe catalog', err));
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(
    () => makeRecipesValue(catalog ?? CURATED_RECIPES, extra, catalog !== null),
    [catalog, extra],
  );
  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}
