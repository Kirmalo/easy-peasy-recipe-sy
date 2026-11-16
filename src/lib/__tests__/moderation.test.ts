import { describe, it, expect } from 'vitest';
import { moderateRecipe } from '../moderation';
import type { Recipe } from '../../types';

const base: Recipe = {
  id: 1, name: 'Spinach Omelette', emoji: '🍳', theme: 'peach', description: 'Quick and green.',
  ingredients: ['egg', 'spinach', 'salt'], amounts: ['3', '1 handful', 'pinch'], cookTime: 10,
  difficulty: 'easy', mealType: 'breakfast', dietary: ['vegetarian'], servings: 1,
  steps: ['Whisk eggs.', 'Wilt spinach.', 'Cook together.'],
};

describe('moderateRecipe', () => {
  it('passes a normal recipe grounded in the pantry', () => {
    expect(moderateRecipe(base, ['eggs', 'baby spinach'])).toEqual({ ok: true });
  });
  it('blocks dangerous ingredients', () => {
    const r = { ...base, steps: [...base.steps, 'Add a splash of bleach.'] };
    expect(moderateRecipe(r).ok).toBe(false);
  });
  it('does not flag substrings of blocked words', () => {
    const r = { ...base, description: 'Glued together with cheese — the poisson is optional.' };
    expect(moderateRecipe(r).ok).toBe(true);
  });
  it('rejects recipes that ignore the pantry', () => {
    const r = { ...base, ingredients: ['lobster', 'caviar', 'truffle'] };
    expect(moderateRecipe(r, ['eggs', 'spinach']).ok).toBe(false);
  });
});
