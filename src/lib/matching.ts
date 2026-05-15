import type { Recipe, MatchResult } from '../types';
import { STAPLES } from '../data/staples';

const normalize = (s: string): string => s.toLowerCase().trim();

export const ingMatches = (recipeIng: string, pantryIng: string): boolean => {
  const r = normalize(recipeIng);
  const p = normalize(pantryIng);
  if (r === p) return true;
  if (r.includes(p) || p.includes(r)) return true;
  if (r.replace(/s$/, '') === p.replace(/s$/, '')) return true;
  return false;
};

export const computeMatch = (recipe: Recipe, pantry: string[]): MatchResult => {
  if (!pantry.length) {
    return { score: 0.5, have: 0, need: recipe.ingredients.length, missing: recipe.ingredients };
  }
  let have = 0;
  const missing: string[] = [];
  recipe.ingredients.forEach((ri) => {
    if (pantry.some((p) => ingMatches(ri, p))) have++;
    else missing.push(ri);
  });
  return { score: have / recipe.ingredients.length, have, need: recipe.ingredients.length, missing };
};

export const isStaple = (ing: string): boolean =>
  STAPLES.some((s) => ingMatches(ing, s));
