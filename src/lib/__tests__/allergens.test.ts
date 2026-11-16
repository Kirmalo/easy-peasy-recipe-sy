import { describe, it, expect } from 'vitest';
import { detectAllergens, verifiedDietary } from '../allergens';
import type { Recipe } from '../../types';

const r = (ingredients: string[], dietary: Recipe['dietary'] = []): Recipe => ({
  id: Math.random(), name: 'x', emoji: '🍽️', theme: 'tomato', description: '', ingredients, amounts: ingredients.map(() => ''),
  cookTime: 10, difficulty: 'easy', mealType: 'dinner', dietary, servings: 2, steps: ['x'],
});

describe('detectAllergens', () => {
  it('finds common allergens', () => {
    expect(detectAllergens(r(['spaghetti', 'parmesan', 'egg yolk', 'pine nuts', 'soy sauce']))).toEqual(
      ['gluten', 'dairy', 'egg', 'tree-nut', 'soy'],
    );
    expect(detectAllergens(r(['salmon fillet', 'king prawns', 'tahini']))).toEqual(['fish', 'shellfish', 'sesame']);
  });
  it('ignores look-alikes', () => {
    expect(detectAllergens(r(['eggplant', 'coconut milk', 'almond flour', 'rice noodles', 'butternut squash', 'cream of tartar', 'nutmeg']))).toEqual(
      ['tree-nut'], // almond flour is a tree nut, not gluten
    );
    expect(detectAllergens(r(['corn tortillas', 'gluten-free pasta', 'peanut butter']))).toEqual(['peanut']);
  });
});

describe('verifiedDietary', () => {
  it('drops tags the ingredients contradict', () => {
    expect(verifiedDietary(r(['tofu', 'butter'], ['vegan', 'vegetarian']))).toEqual(['vegetarian']);
    expect(verifiedDietary(r(['chicken stock', 'rice'], ['vegetarian', 'gluten-free']))).toEqual(['gluten-free']);
    expect(verifiedDietary(r(['flour', 'sugar'], ['gluten-free', 'vegan']))).toEqual(['vegan']);
    expect(verifiedDietary(r(['vegan sausage', 'oat milk'], ['vegan']))).toEqual(['vegan']);
  });
});
