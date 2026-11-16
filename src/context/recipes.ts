import { createContext, useContext, useMemo } from 'react';
import { CURATED_RECIPES } from '../data/recipes';
import type { Recipe } from '../types';

export interface RecipesValue {
  /** Built-in catalog (curated until the full catalog chunk has loaded). */
  builtIn: Recipe[];
  /** Built-in recipes followed by AI-generated ones. */
  all: Recipe[];
  byId: Map<number, Recipe>;
  /** True once the full built-in catalog has loaded. */
  ready: boolean;
}

export const makeRecipesValue = (builtIn: Recipe[], extra: Recipe[], ready: boolean): RecipesValue => {
  const byId = new Map(builtIn.map((r) => [r.id, r]));
  for (const r of extra) if (!byId.has(r.id)) byId.set(r.id, r);
  return { builtIn, all: [...byId.values()], byId, ready };
};

export const RecipesContext = createContext<RecipesValue>(makeRecipesValue(CURATED_RECIPES, [], false));

export const useRecipes = (): RecipesValue => useContext(RecipesContext);

/** Look up a single recipe (built-in or AI) by id. */
export const useRecipe = (id: number | null | undefined): Recipe | undefined => {
  const { byId } = useRecipes();
  return id == null ? undefined : byId.get(id);
};

/** Resolve a list of ids to recipes, dropping any that no longer exist. */
export const useRecipeList = (ids: number[]): Recipe[] => {
  const { byId } = useRecipes();
  return useMemo(() => ids.map((id) => byId.get(id)).filter((r): r is Recipe => r !== undefined), [ids, byId]);
};
