import type { Recipe, MatchResult } from '../types/index.js';
import { STAPLES } from '../data/staples.js';
import { SUBSTITUTIONS } from '../data/substitutions.js';

// Regional / alternate names collapsed to one canonical phrase before matching.
const SYNONYMS: Array<[RegExp, string]> = [
  [/\b(scallions?|spring onions?|green onions?)\b/g, 'scallion'],
  [/\b(coriander leaf|coriander leaves|fresh coriander)\b/g, 'cilantro'],
  [/\bcourgettes?\b/g, 'zucchini'],
  [/\baubergines?\b/g, 'eggplant'],
  [/\bprawns?\b/g, 'shrimp'],
  [/\b(garbanzo beans?|garbanzos?)\b/g, 'chickpea'],
  [/\bcapsicums?\b/g, 'bell pepper'],
  [/\b(beef mince|minced beef|ground beef)\b/g, 'ground beef'],
  [/\b(pork mince|minced pork)\b/g, 'ground pork'],
  [/\b(lamb mince|minced lamb)\b/g, 'ground lamb'],
  [/\bcaster sugar\b/g, 'sugar'],
  [/\bplain flour\b/g, 'flour'],
  [/\ball[- ]purpose flour\b/g, 'flour'],
];

// Words that turn the preceding ingredient into a different product:
// "rice" is not "rice vinegar", "chicken" is not "chicken stock".
const PRODUCT_WORDS = new Set([
  'vinegar', 'flour', 'oil', 'sauce', 'paste', 'powder', 'stock', 'broth',
  'extract', 'flakes', 'wine', 'syrup', 'milk', 'cream', 'butter', 'noodle',
  'starch', 'seed', 'bouillon', 'essence', 'liqueur', 'jam', 'chip',
]);

// Only these drop "-ves" for "-f"; cloves / olives / chives just lose the "s".
const VES_TO_F = new Set(['leaves', 'halves', 'loaves', 'calves', 'shelves']);

function singular(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('oes')) return word.slice(0, -2);
  if (VES_TO_F.has(word)) return word.slice(0, -3) + 'f';
  if (/(ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

const tokenCache = new Map<string, string[]>();

export function tokenize(s: string): string[] {
  const cached = tokenCache.get(s);
  if (cached) return cached;
  let t = s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  t = t.replace(/[^a-z\s-]/g, ' ').replace(/-/g, ' ');
  for (const [re, rep] of SYNONYMS) t = t.replace(re, rep);
  const tokens = t.split(/\s+/).filter(Boolean).map(singular);
  tokenCache.set(s, tokens);
  return tokens;
}

/** Index where `needle` appears as a contiguous run inside `hay`, or -1. */
export function findRun(hay: string[], needle: string[]): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/**
 * Whole-word match between a recipe ingredient and a pantry item.
 * "chicken" ↔ "chicken breast" ✓, "egg" ↔ "eggplant" ✗, "rice" ↔ "rice vinegar" ✗.
 */
export const ingMatches = (recipeIng: string, pantryIng: string): boolean => {
  const r = tokenize(recipeIng);
  const p = tokenize(pantryIng);
  if (!r.length || !p.length) return false;
  if (p.join('').length < 2 || r.join('').length < 2) return false;

  const [short, long] = r.length <= p.length ? [r, p] : [p, r];
  const at = findRun(long, short);
  if (at === -1) return false;
  const next = long[at + short.length];
  return !(next && PRODUCT_WORDS.has(next));
};

export interface SubstituteMatch {
  /** Pantry item to use instead. */
  use: string;
  note: string;
}

/** A pantry item that can stand in for a missing recipe ingredient, or null. */
export function findSubstitute(ingredient: string, pantry: string[]): SubstituteMatch | null {
  for (const sub of SUBSTITUTIONS) {
    if (!ingMatches(ingredient, sub.for)) continue;
    for (const option of sub.use) {
      const have = pantry.find((p) => ingMatches(option, p));
      if (have) return { use: have, note: sub.note };
    }
  }
  return null;
}

/** A substitute counts for most, but not all, of an ingredient you actually have. */
const SUBSTITUTE_WEIGHT = 0.75;

export const computeMatch = (recipe: Recipe, pantry: string[]): MatchResult => {
  if (!pantry.length) {
    return { score: 0, have: 0, need: recipe.ingredients.length, missing: recipe.ingredients, substitutes: [] };
  }
  let have = 0;
  const missing: string[] = [];
  const substitutes: MatchResult['substitutes'] = [];
  recipe.ingredients.forEach((ri) => {
    if (pantry.some((p) => ingMatches(ri, p))) { have++; return; }
    const sub = findSubstitute(ri, pantry);
    if (sub) substitutes.push({ ingredient: ri, ...sub });
    else missing.push(ri);
  });
  const need = recipe.ingredients.length;
  return { score: (have + SUBSTITUTE_WEIGHT * substitutes.length) / need, have, need, missing, substitutes };
};

// Descriptors that can precede a staple without changing what it is.
const STAPLE_PREFIXES = new Set([
  'fresh', 'ground', 'black', 'white', 'sea', 'kosher', 'table', 'dried', 'extra',
  'virgin', 'unsalted', 'salted', 'granulated', 'brown', 'light', 'dark', 'whole',
  'large', 'medium', 'small', 'free', 'range', 'red', 'yellow', 'chopped', 'minced',
  'cold', 'warm', 'hot', 'boiling', 'semi', 'skimmed', 'full', 'fat', 'raw', 'clear',
]);
const STAPLE_SUFFIXES = new Set(['clove', 'leaf', 'sprig', 'bulb', 'yolk']);

/** True when `ing` is a common pantry staple (e.g. "freshly ground black pepper"), not "bell pepper". */
export const isStaple = (ing: string): boolean => {
  const t = tokenize(ing);
  return STAPLES.some((s) => {
    const st = tokenize(s);
    const at = findRun(t, st);
    if (at === -1) return false;
    const before = t.slice(0, at);
    const after = t.slice(at + st.length);
    return before.every((w) => STAPLE_PREFIXES.has(w) || w === 'freshly')
      && after.every((w) => STAPLE_SUFFIXES.has(w));
  });
};

/** Default ordering when scores tie (or the pantry is empty): quick, short recipes first. */
export const compareByEase = (a: Recipe, b: Recipe): number =>
  a.cookTime - b.cookTime || a.ingredients.length - b.ingredients.length;
