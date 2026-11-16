import { describe, it, expect } from 'vitest';
import { parseSpokenIngredients } from '../parseSpeech';

describe('parseSpokenIngredients', () => {
  it('strips filler and splits on "and" / commas', () => {
    expect(parseSpokenIngredients("Um, I've got some eggs, a bit of spinach and feta")).toEqual(['eggs', 'spinach', 'feta']);
  });
  it('handles "then" and full stops', () => {
    expect(parseSpokenIngredients('chicken then rice. lemons')).toEqual(['chicken', 'rice', 'lemons']);
  });
  it('returns [] for empty input', () => expect(parseSpokenIngredients('')).toEqual([]));
});
