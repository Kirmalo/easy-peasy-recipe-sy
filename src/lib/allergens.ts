import type { DietaryTag, Recipe } from '../types';
import { tokenize, findRun } from './matching';

export type Allergen = 'gluten' | 'dairy' | 'egg' | 'peanut' | 'tree-nut' | 'soy' | 'fish' | 'shellfish' | 'sesame';

export const ALLERGEN_LABELS: Record<Allergen, { label: string; icon: string }> = {
  gluten: { label: 'Gluten', icon: '🌾' },
  dairy: { label: 'Dairy', icon: '🥛' },
  egg: { label: 'Egg', icon: '🥚' },
  peanut: { label: 'Peanut', icon: '🥜' },
  'tree-nut': { label: 'Tree nuts', icon: '🌰' },
  soy: { label: 'Soy', icon: '🫘' },
  fish: { label: 'Fish', icon: '🐟' },
  shellfish: { label: 'Shellfish', icon: '🦐' },
  sesame: { label: 'Sesame', icon: '⚪' },
};

interface Rule {
  terms: string[];
  /** Words that, right before the term, mean it's not this allergen ("almond milk"). */
  unlessBefore?: string[];
  /** Words that, right after the term, mean it's not this allergen ("cream of tartar"). */
  unlessAfter?: string[];
}

const FREE_FROM = ['gluten', 'free', 'dairy', 'vegan', 'plant', 'based', 'non'];

const RULES: Record<Allergen, Rule> = {
  gluten: {
    terms: ['wheat', 'flour', 'bread', 'breadcrumb', 'panko', 'pasta', 'spaghetti', 'linguine', 'fettuccine', 'penne',
      'macaroni', 'lasagne', 'lasagna', 'noodle', 'couscous', 'barley', 'rye', 'bulgur', 'semolina', 'farro', 'spelt',
      'seitan', 'tortilla', 'pita', 'naan', 'bun', 'roll', 'baguette', 'pastry', 'puff pastry', 'cracker', 'biscuit',
      'soy sauce', 'beer', 'udon', 'ramen', 'gnocchi', 'crouton', 'brioche', 'ciabatta', 'sourdough', 'orzo', 'ravioli', 'tortellini'],
    unlessBefore: [...FREE_FROM, 'rice', 'almond', 'coconut', 'chickpea', 'corn', 'tapioca', 'potato', 'buckwheat', 'glass', 'shirataki', 'zucchini', 'lentil', 'oat', 'spring', 'egg'],
    unlessAfter: ['free'],
  },
  dairy: {
    terms: ['milk', 'butter', 'buttermilk', 'cream', 'cheese', 'yogurt', 'yoghurt', 'ghee', 'parmesan', 'pecorino', 'mozzarella',
      'cheddar', 'feta', 'ricotta', 'mascarpone', 'brie', 'gouda', 'halloumi', 'paneer', 'creme fraiche', 'custard', 'whey', 'gruyere', 'provolone', 'burrata'],
    unlessBefore: [...FREE_FROM, 'coconut', 'almond', 'oat', 'soy', 'rice', 'cashew', 'peanut', 'cocoa', 'nut', 'apple', 'shea', 'vegetable', 'sunflower', 'seed'],
    unlessAfter: ['of tartar', 'free', 'cracker'],
  },
  egg: { terms: ['egg', 'mayonnaise', 'mayo', 'aioli', 'meringue'], unlessBefore: ['vegan', 'flax', 'chia'], unlessAfter: ['free'] },
  peanut: { terms: ['peanut', 'satay'] },
  'tree-nut': {
    terms: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia', 'pine nut', 'brazil nut', 'praline', 'marzipan', 'nutella'],
  },
  soy: { terms: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh'] },
  fish: {
    terms: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'mackerel', 'haddock', 'trout', 'tilapia', 'bass', 'halibut',
      'snapper', 'hake', 'pollock', 'monkfish', 'swordfish', 'worcestershire', 'bonito', 'dashi'],
    unlessBefore: ['vegan'],
  },
  shellfish: { terms: ['shrimp', 'crab', 'lobster', 'mussel', 'clam', 'oyster', 'scallop', 'squid', 'calamari', 'crayfish', 'langoustine', 'octopus'] },
  sesame: { terms: ['sesame', 'tahini', 'halva', 'zaatar'] },
};

const MEAT = ['chicken', 'beef', 'pork', 'lamb', 'mutton', 'bacon', 'ham', 'sausage', 'turkey', 'duck', 'veal', 'goat', 'venison',
  'chorizo', 'pancetta', 'prosciutto', 'salami', 'pepperoni', 'steak', 'mince', 'meatball', 'gelatin', 'gelatine', 'lard', 'suet',
  'oxtail', 'brisket', 'rib', 'liver', 'guanciale', 'nduja'];
const NOT_MEAT_BEFORE = ['vegan', 'vegetarian', 'plant', 'meatless', 'veggie', 'soy', 'tofu', 'mushroom', 'beyond', 'impossible'];
const ANIMAL_PRODUCTS = ['honey'];

const compiled = (terms: string[]) => terms.map((t) => tokenize(t));

function hits(ingredient: string, rule: Rule): boolean {
  const t = tokenize(ingredient);
  const before = rule.unlessBefore ? new Set(rule.unlessBefore.flatMap((w) => tokenize(w))) : null;
  const after = rule.unlessAfter?.map((w) => tokenize(w));
  return compiled(rule.terms).some((term) => {
    const at = findRun(t, term);
    if (at === -1) return false;
    if (before && at > 0 && before.has(t[at - 1])) return false;
    if (after?.some((a) => findRun(t.slice(at + term.length, at + term.length + a.length), a) === 0)) return false;
    return true;
  });
}

const allergenCache = new WeakMap<Recipe, Allergen[]>();

/** Allergens detected from the ingredient list (best effort — always check labels). */
export function detectAllergens(recipe: Recipe): Allergen[] {
  const cached = allergenCache.get(recipe);
  if (cached) return cached;
  const found = (Object.keys(RULES) as Allergen[]).filter((a) => recipe.ingredients.some((i) => hits(i, RULES[a])));
  allergenCache.set(recipe, found);
  return found;
}

const isMeat = (ing: string) => hits(ing, { terms: MEAT, unlessBefore: NOT_MEAT_BEFORE });

const dietCache = new WeakMap<Recipe, DietaryTag[]>();

/** Dietary tags with contradictions removed (e.g. "vegan" on a recipe with butter). */
export function verifiedDietary(recipe: Recipe): DietaryTag[] {
  const cached = dietCache.get(recipe);
  if (cached) return cached;
  const allergens = new Set(detectAllergens(recipe));
  const meat = recipe.ingredients.some(isMeat);
  const seafood = allergens.has('fish') || allergens.has('shellfish');
  const animal = allergens.has('dairy') || allergens.has('egg') || recipe.ingredients.some((i) => hits(i, { terms: ANIMAL_PRODUCTS }));
  const result = recipe.dietary.filter((d) => {
    if (d === 'vegetarian') return !meat && !seafood;
    if (d === 'vegan') return !meat && !seafood && !animal;
    if (d === 'gluten-free') return !allergens.has('gluten');
    return true;
  });
  dietCache.set(recipe, result);
  return result;
}
