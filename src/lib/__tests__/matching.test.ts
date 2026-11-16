import { describe, it, expect } from 'vitest';
import { ingMatches, isStaple, computeMatch, tokenize, compareByEase } from '../matching';
import type { Recipe } from '../../types';

const recipe = (over: Partial<Recipe>): Recipe => ({
  id: 1, name: 'Test', emoji: '🍽️', theme: 'tomato', description: '',
  ingredients: [], amounts: [], cookTime: 20, difficulty: 'easy', mealType: 'dinner',
  dietary: [], servings: 2, steps: ['Cook.'], ...over,
});

describe('ingMatches', () => {
  it.each([
    ['chicken breast', 'chicken'],
    ['chicken', 'chicken breasts'],
    ['tomatoes', 'tomato'],
    ['cherry tomatoes', 'tomato'],
    ['olive oil', 'oil'],
    ['spring onions', 'scallion'],
    ['courgette', 'zucchini'],
    ['minced beef', 'ground beef'],
    ['Lemon Juice', 'lemon'],
    ['jalapeño', 'jalapeno'],
  ])('%s ↔ %s matches', (r, p) => expect(ingMatches(r, p)).toBe(true));

  it.each([
    ['eggplant', 'egg'],
    ['rice', 'ice'],
    ['peppercorns', 'corn'],
    ['champagne', 'ham'],
    ['rice vinegar', 'rice'],
    ['chicken stock', 'chicken'],
    ['coconut milk', 'coconut'],
    ['garlic powder', 'garlic'],
    ['peanut butter', 'peanut'],
    ['anything', 'a'],
    ['', 'egg'],
  ])('%s ↔ %s does not match', (r, p) => expect(ingMatches(r, p)).toBe(false));
});

describe('tokenize', () => {
  it('lowercases, strips punctuation and singularises', () => {
    expect(tokenize('Fresh Berries, chopped!')).toEqual(['fresh', 'berry', 'chopped']);
    expect(tokenize('potatoes')).toEqual(['potato']);
    expect(tokenize('couscous')).toEqual(['couscous']);
    expect(tokenize('olives cloves bay leaves')).toEqual(['olive', 'clove', 'bay', 'leaf']);
  });
});

describe('isStaple', () => {
  it.each(['salt', 'sea salt', 'freshly ground black pepper', 'garlic cloves', 'extra virgin olive oil', 'red onion', 'eggs'])(
    '%s is a staple', (i) => expect(isStaple(i)).toBe(true),
  );
  it.each(['bell pepper', 'chicken', 'garlic bread', 'cumin-spiced lamb', 'onion rings'])(
    '%s is not a staple', (i) => expect(isStaple(i)).toBe(false),
  );
});

describe('computeMatch', () => {
  const r = recipe({ ingredients: ['egg', 'spinach', 'feta cheese'] });

  it('counts have / missing', () => {
    expect(computeMatch(r, ['eggs', 'feta'])).toEqual({ score: 2 / 3, have: 2, need: 3, missing: ['spinach'] });
  });
  it('scores 0 with an empty pantry', () => {
    expect(computeMatch(r, []).score).toBe(0);
  });
});

describe('compareByEase', () => {
  it('prefers quicker, then shorter recipes', () => {
    const quick = recipe({ cookTime: 10, ingredients: ['a', 'b', 'c'] });
    const slow = recipe({ cookTime: 40, ingredients: ['a'] });
    const quickShort = recipe({ cookTime: 10, ingredients: ['a'] });
    expect([slow, quick, quickShort].sort(compareByEase)).toEqual([quickShort, quick, slow]);
  });
});
