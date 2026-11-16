import { describe, it, expect } from 'vitest';
import { inferCuisine } from '../cuisine';
import type { Recipe } from '../../types';

const r = (name: string, description = ''): Recipe => ({
  id: 1, name, description, emoji: '🍽️', theme: 'tomato', ingredients: ['x'], amounts: [''],
  cookTime: 10, difficulty: 'easy', mealType: 'dinner', dietary: [], servings: 2, steps: ['x'],
});

describe('inferCuisine', () => {
  it.each([
    ['Spaghetti Carbonara', 'italian'],
    ['Chicken Tikka Masala', 'indian'],
    ['Pad Thai', 'thai'],
    ['Beef Bulgogi', 'korean'],
    ['Fish Tacos', 'mexican'],
    ['Chinese Lemon Chicken', 'chinese'],
  ])('%s → %s', (name, cuisine) => expect(inferCuisine(r(name))).toBe(cuisine));

  it('returns null when nothing matches', () => expect(inferCuisine(r('Toast'))).toBeNull());
});
