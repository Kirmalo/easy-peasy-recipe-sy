// Shared by the client and the /api routes — keep this file free of DOM and Node APIs.
import type { Recipe, ThemeName, Difficulty, MealType, DietaryTag, ApplianceTag } from '../types';

export const THEME_NAMES: readonly ThemeName[] = ['tomato', 'sage', 'mustard', 'berry', 'peach', 'ocean', 'forest', 'rose'];
const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
const DIETARY: readonly DietaryTag[] = ['vegetarian', 'vegan', 'gluten-free'];
const APPLIANCES: readonly ApplianceTag[] = ['stovetop', 'oven', 'air-fryer', 'grill', 'slow-cooker', 'microwave', 'blender'];

/** AI-generated recipe ids live at or above this value; seed data stays below it. */
export const AI_ID_BASE = 1_000_000_000;

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const strArray = (v: unknown, maxItems: number, maxLen: number): string[] | null =>
  Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter((x): x is string => x !== null) : null;

const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;

/**
 * Returns a well-formed Recipe, or null when the input can't be trusted.
 * Used on AI output before it is stored, on community recipes when read back,
 * and on recipes restored from localStorage.
 */
export function sanitizeRecipe(input: unknown): Recipe | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;

  const id = typeof o.id === 'number' && Number.isSafeInteger(o.id) && o.id > 0 ? o.id : null;
  const name = str(o.name, 80);
  const description = str(o.description, 300) ?? '';
  const ingredients = strArray(o.ingredients, 30, 60);
  const steps = strArray(o.steps, 15, 600);
  const difficulty = oneOf(o.difficulty, DIFFICULTIES) ?? 'easy';
  const mealType = oneOf(o.mealType, MEAL_TYPES) ?? 'dinner';
  const theme = oneOf(o.theme, THEME_NAMES) ?? 'tomato';

  if (id === null || !name || !ingredients?.length || !steps?.length) return null;

  // Keep amounts aligned 1:1 with ingredients.
  const rawAmounts = Array.isArray(o.amounts) ? o.amounts : [];
  const amounts = ingredients.map((_, i) => str(rawAmounts[i], 40) ?? '');

  const emojiRaw = str(o.emoji, 8);
  const emoji = emojiRaw && !/[a-z0-9<>]/i.test(emojiRaw) ? emojiRaw : '🍽️';

  const cookTime = Math.round(Math.max(1, Math.min(600, Number(o.cookTime) || 30)));
  const servings = Math.round(Math.max(1, Math.min(24, Number(o.servings) || 4)));
  const dietary = [...new Set((Array.isArray(o.dietary) ? o.dietary : []).map((d) => oneOf(d, DIETARY)).filter((d): d is DietaryTag => d !== null))];
  const appliances = Array.isArray(o.appliances)
    ? [...new Set(o.appliances.map((a) => oneOf(a, APPLIANCES)).filter((a): a is ApplianceTag => a !== null))]
    : undefined;

  return {
    id, name, emoji, theme, description,
    ingredients: ingredients.map((i) => i.toLowerCase()),
    amounts, cookTime, difficulty, mealType, dietary, servings, steps,
    ...(appliances?.length ? { appliances } : {}),
  };
}

export function sanitizeRecipes(list: unknown): Recipe[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<number>();
  const out: Recipe[] = [];
  for (const item of list) {
    const r = sanitizeRecipe(item);
    if (r && !seen.has(r.id)) { seen.add(r.id); out.push(r); }
  }
  return out;
}
