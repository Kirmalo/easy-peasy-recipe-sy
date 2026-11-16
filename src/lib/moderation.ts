// Deterministic screen for AI recipes before they're shown or shared with other users.
// Pure — shared by the client and /api routes.
import type { Recipe } from '../types';
import { ingMatches, isStaple } from './matching';

// Non-food / dangerous items and clearly off-topic content. Whole-word, case-insensitive.
const BLOCKED_TERMS = [
  'bleach', 'ammonia', 'detergent', 'drain cleaner', 'antifreeze', 'gasoline', 'petrol', 'kerosene',
  'lighter fluid', 'motor oil', 'rat poison', 'poison', 'pesticide', 'insecticide', 'cyanide',
  'arsenic', 'mercury', 'lead paint', 'paint thinner', 'glue', 'laundry pod', 'tide pod',
  'urine', 'feces', 'faeces', 'semen', 'human flesh', 'cannibal',
  'cocaine', 'heroin', 'methamphetamine', 'fentanyl',
  'fuck', 'shit', 'cunt', 'bitch',
];
const BLOCKED_RE = new RegExp(`\\b(${BLOCKED_TERMS.map((t) => t.replace(/ /g, '\\s+')).join('|')})\\b`, 'i');

export type ModerationResult = { ok: true } | { ok: false; reason: string };

function recipeText(r: Recipe): string {
  return [r.name, r.description, ...r.ingredients, ...r.amounts, ...r.steps].join('\n');
}

/** Pantry entries that are non-food or otherwise blocked; screened before calling the AI. */
export function blockedPantryItems(pantry: string[]): string[] {
  return pantry.filter((p) => BLOCKED_RE.test(p));
}

/**
 * Screens a generated recipe.
 * - rejects blocked terms anywhere in the text
 * - when a pantry is given, requires the recipe to be built on it: at least one pantry
 *   ingredient, and at least half of the non-staple ingredients from the pantry. Staples
 *   alone don't count, so a generic "salt, oil, onion" fallback is rejected — that's what
 *   the model produces when the pantry was junk or prompt injection.
 */
export function moderateRecipe(recipe: Recipe, pantry?: string[]): ModerationResult {
  const hit = recipeText(recipe).match(BLOCKED_RE);
  if (hit) return { ok: false, reason: `blocked term: ${hit[1].toLowerCase()}` };

  if (pantry?.length) {
    const fromPantry = (i: string) => pantry.some((p) => ingMatches(i, p));
    const used = recipe.ingredients.filter(fromPantry).length;
    const nonStaples = recipe.ingredients.filter((i) => !isStaple(i));
    const groundedNonStaples = nonStaples.filter(fromPantry).length;
    if (used === 0) return { ok: false, reason: 'recipe uses none of the provided ingredients' };
    if (nonStaples.length && groundedNonStaples / nonStaples.length < 0.5) {
      return { ok: false, reason: 'recipe does not use the provided ingredients' };
    }
  }
  return { ok: true };
}
