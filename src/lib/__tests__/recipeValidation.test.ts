import { describe, it, expect } from 'vitest';
import { sanitizeRecipe, sanitizeRecipes } from '../recipeValidation';

const valid = {
  id: 1_000_000_001, name: 'Eggy Bread', emoji: '🍞', theme: 'peach', description: 'Nice.',
  ingredients: ['Egg', 'bread'], amounts: ['2'], cookTime: 10, difficulty: 'easy',
  mealType: 'breakfast', dietary: ['vegetarian', 'keto'], servings: 2, steps: ['Dip', 'Fry'],
};

describe('sanitizeRecipe', () => {
  it('accepts a valid recipe and normalises fields', () => {
    const r = sanitizeRecipe(valid)!;
    expect(r.ingredients).toEqual(['egg', 'bread']);
    expect(r.amounts).toEqual(['2', '']); // padded to match ingredients
    expect(r.dietary).toEqual(['vegetarian']); // unknown tag dropped
  });
  it('rejects missing essentials', () => {
    expect(sanitizeRecipe({ ...valid, id: 'x' })).toBeNull();
    expect(sanitizeRecipe({ ...valid, name: '' })).toBeNull();
    expect(sanitizeRecipe({ ...valid, steps: [] })).toBeNull();
    expect(sanitizeRecipe(null)).toBeNull();
  });
  it('defaults bad enums and clamps numbers', () => {
    const r = sanitizeRecipe({ ...valid, theme: 'neon', difficulty: 'insane', cookTime: 99999, servings: -3, emoji: '<script>' })!;
    expect(r.theme).toBe('tomato');
    expect(r.difficulty).toBe('easy');
    expect(r.cookTime).toBe(600);
    expect(r.servings).toBe(1);
    expect(r.emoji).toBe('🍽️');
  });
});

describe('sanitizeRecipes', () => {
  it('drops invalid and duplicate entries', () => {
    expect(sanitizeRecipes([valid, valid, { nope: true }]).length).toBe(1);
    expect(sanitizeRecipes('not a list')).toEqual([]);
  });
});
