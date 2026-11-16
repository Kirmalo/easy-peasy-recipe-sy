import { describe, it, expect } from 'vitest';
import { sanitizePersisted } from '../appStore';

describe('sanitizePersisted', () => {
  it('fills defaults for missing / garbage input', () => {
    const s = sanitizePersisted('garbage');
    expect(s.pantry).toEqual([]);
    expect(s.filters.ingredientMode).toBe('all');
    expect(s.myAiRecipes).toEqual([]);
  });
  it('drops invalid entries and de-duplicates ids', () => {
    const s = sanitizePersisted({
      pantry: ['egg', 3, '', 'milk'],
      cookbook: [1, 1, 'x', 2.5, 3],
      ratings: { 1: 3, 2: 9, x: 1 },
      notes: { 5: 'tasty', 6: 42 },
      filters: { cookTime: 30, dietary: 'vegan' },
    });
    expect(s.pantry).toEqual(['egg', 'milk']);
    expect(s.cookbook).toEqual([1, 3]);
    expect(s.ratings).toEqual({ 1: 3 });
    expect(s.notes).toEqual({ 5: 'tasty' });
    expect(s.filters.cookTime).toBe(30);
    expect(s.filters.dietary).toEqual([]);
  });
  it('caps history lists', () => {
    const s = sanitizePersisted({ passed: Array.from({ length: 600 }, (_, i) => i + 1) });
    expect(s.passed.length).toBe(500);
    expect(s.passed[0]).toBe(101);
  });
});
