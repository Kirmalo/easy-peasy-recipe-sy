import { useMemo, type ReactNode } from 'react';
import { RecipesContext, BUILT_IN_RECIPES, type RecipesValue } from './recipes';
import type { Recipe } from '../types';

export function RecipesProvider({ extra, children }: { extra: Recipe[]; children: ReactNode }) {
  const value = useMemo<RecipesValue>(() => {
    if (!extra.length) return BUILT_IN_RECIPES;
    const byId = new Map(BUILT_IN_RECIPES.byId);
    for (const r of extra) if (!byId.has(r.id)) byId.set(r.id, r);
    return { all: [...byId.values()], byId };
  }, [extra]);
  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}
