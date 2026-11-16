import { createContext, useContext, useMemo } from 'react';
import { RECIPES } from '../data/recipes';
import type { Recipe } from '../types';

export interface RecipesValue {
  /** Built-in recipes followed by AI-generated ones. */
  all: Recipe[];
  byId: Map<number, Recipe>;
}

export const BUILT_IN_RECIPES: RecipesValue = { all: RECIPES, byId: new Map(RECIPES.map((r) => [r.id, r])) };

export const RecipesContext = createContext<RecipesValue>(BUILT_IN_RECIPES);

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
