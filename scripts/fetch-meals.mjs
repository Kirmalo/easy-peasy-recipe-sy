#!/usr/bin/env node
// Fetches all meals from TheMealDB free API and generates src/data/recipes-extended.ts
// Run with: npm run fetch-recipes

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATEGORY_TO_MEALTYPE = {
  Beef: 'dinner', Chicken: 'dinner', Lamb: 'dinner', Pork: 'dinner',
  Seafood: 'dinner', Pasta: 'dinner', Vegetarian: 'dinner', Vegan: 'dinner',
  Goat: 'dinner', Miscellaneous: 'dinner',
  Breakfast: 'breakfast',
  Dessert: 'dessert',
  Side: 'snack', Starter: 'snack',
};

const CATEGORY_TO_EMOJI = {
  Beef: '🥩', Chicken: '🍗', Lamb: '🍖', Pork: '🥩',
  Seafood: '🦐', Pasta: '🍝', Vegetarian: '🥗', Vegan: '🌿',
  Breakfast: '🍳', Dessert: '🍰', Side: '🥗', Starter: '🥗',
  Goat: '🍖', Miscellaneous: '🍽️',
};

const CATEGORY_TO_THEME = {
  Beef: 'tomato', Chicken: 'mustard', Lamb: 'rose', Pork: 'peach',
  Seafood: 'ocean', Pasta: 'mustard', Vegetarian: 'sage', Vegan: 'forest',
  Breakfast: 'peach', Dessert: 'berry', Side: 'sage', Starter: 'sage',
  Goat: 'rose', Miscellaneous: 'tomato',
};

const MEAT = ['beef', 'chicken', 'pork', 'lamb', 'salmon', 'tuna', 'shrimp', 'prawn',
  'turkey', 'veal', 'duck', 'bacon', 'ham', 'sausage', 'anchovy', 'crab',
  'lobster', 'fish', 'mince', 'steak', 'venison', 'bison', 'chorizo', 'pepperoni'];
const DAIRY = ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt', 'egg',
  'parmesan', 'mozzarella', 'cheddar', 'ricotta', 'brie', 'feta'];
const GLUTEN = ['flour', 'bread', 'pasta', 'wheat', 'barley', 'rye', 'noodle',
  'breadcrumb', 'soy sauce', 'couscous', 'bulgur', 'semolina', 'tortilla', 'pita'];

function getDietary(ingredients) {
  const ings = ingredients.map(i => i.toLowerCase());
  const hasMeat   = MEAT.some(k  => ings.some(i => i.includes(k)));
  const hasDairy  = DAIRY.some(k => ings.some(i => i.includes(k)));
  const hasGluten = GLUTEN.some(k => ings.some(i => i.includes(k)));
  const tags = [];
  if (!hasMeat) tags.push('vegetarian');
  if (!hasMeat && !hasDairy) tags.push('vegan');
  if (!hasGluten) tags.push('gluten-free');
  return tags;
}

function parseSteps(raw) {
  if (!raw) return ['Follow the recipe instructions.'];

  // Normalise line endings
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Try splitting on blank lines first (TheMealDB sometimes uses them as step breaks)
  let parts = text.split(/\n\s*\n/).map(s => s.replace(/\n/g, ' ').trim()).filter(Boolean);

  // If that gave us too few, fall back to per-line splitting
  if (parts.length < 3) {
    parts = text.split('\n').map(s => s.trim()).filter(Boolean);
  }

  const steps = parts
    .map(s => s.replace(/^step\s+\d+\s*:?\s*/i, '').replace(/^\d+[\.\)\-:\s]\s*/, '').trim())
    .filter(s => s.length >= 20)
    .slice(0, 12);

  return steps.length > 0 ? steps : ['Follow the recipe instructions.'];
}

function estimateCookTime(instructions, ingCount) {
  const len = (instructions || '').length;
  if (len > 2000 || ingCount > 12) return 60;
  if (len > 1200 || ingCount > 8)  return 45;
  if (len > 600  || ingCount > 5)  return 30;
  return 20;
}

function getIngredients(meal) {
  const ingredients = [], amounts = [];
  for (let i = 1; i <= 20; i++) {
    const ing     = (meal[`strIngredient${i}`] || '').trim().toLowerCase();
    const measure = (meal[`strMeasure${i}`]    || '').trim();
    if (ing) { ingredients.push(ing); amounts.push(measure || '—'); }
  }
  return { ingredients, amounts };
}

function generateDescription(meal) {
  const area = meal.strArea && meal.strArea !== 'Unknown' ? `${meal.strArea} ` : '';
  const cat  = (meal.strCategory || 'recipe').toLowerCase();
  return `A classic ${area}${cat} dish that's full of flavour and easy to put together.`;
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

async function main() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const byId = new Map();

  console.log('Fetching meals from TheMealDB (a–z)…');
  for (const letter of letters) {
    process.stdout.write(`  ${letter}`);
    try {
      const data = await fetchWithRetry(
        `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`
      );
      if (data.meals) {
        for (const m of data.meals) if (!byId.has(m.idMeal)) byId.set(m.idMeal, m);
      }
    } catch {
      process.stdout.write('(fail)');
    }
    await new Promise(r => setTimeout(r, 80));
  }
  console.log(`\nFetched ${byId.size} unique meals.`);

  const recipes = [];
  const imageMap = {};

  for (const meal of byId.values()) {
    const { ingredients, amounts } = getIngredients(meal);
    if (ingredients.length < 3) continue;

    const category = meal.strCategory || 'Miscellaneous';
    recipes.push({
      id:          parseInt(meal.idMeal),
      name:        meal.strMeal,
      emoji:       CATEGORY_TO_EMOJI[category]    ?? '🍽️',
      theme:       CATEGORY_TO_THEME[category]    ?? 'tomato',
      description: generateDescription(meal),
      ingredients,
      amounts,
      cookTime:    estimateCookTime(meal.strInstructions, ingredients.length),
      difficulty:  ingredients.length <= 5 ? 'easy' : ingredients.length <= 10 ? 'medium' : 'hard',
      mealType:    CATEGORY_TO_MEALTYPE[category] ?? 'dinner',
      dietary:     getDietary(ingredients),
      servings:    4,
      steps:       parseSteps(meal.strInstructions),
    });

    if (meal.strMealThumb) imageMap[parseInt(meal.idMeal)] = meal.strMealThumb;
  }

  console.log(`Transformed ${recipes.length} recipes.`);

  const ts = `// AUTO-GENERATED — do not edit manually.
// Regenerate with: npm run fetch-recipes
// Source: TheMealDB free API (https://www.themealdb.com/api/json/v1/1/)
// Last fetched: ${new Date().toISOString().slice(0, 10)}

import { imageCache } from '../lib/api';
import type { Recipe } from '../types';

export const EXTENDED_RECIPES: Recipe[] = ${JSON.stringify(recipes, null, 2)};

// Seed image cache so photos are instant — no second network call needed.
const EXTENDED_IMAGES: Record<number, string> = ${JSON.stringify(imageMap)};
Object.entries(EXTENDED_IMAGES).forEach(([id, url]) => {
  if (!imageCache.has(Number(id))) imageCache.set(Number(id), url);
});
`;

  const outPath = join(__dirname, '../src/data/recipes-extended.ts');
  writeFileSync(outPath, ts, 'utf8');
  console.log(`Written → ${outPath}`);
  console.log(`Done. ${recipes.length} extended recipes ready.`);
}

main().catch(err => { console.error(err); process.exit(1); });
