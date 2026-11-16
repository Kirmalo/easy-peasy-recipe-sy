import { describe, it, expect } from 'vitest';
import { scaleAmount } from '../scaleAmount';

describe('scaleAmount', () => {
  it('returns the input when factor is 1', () => expect(scaleAmount('2 tbsp', 1)).toBe('2 tbsp'));
  it('scales whole numbers', () => expect(scaleAmount('2 tbsp', 2)).toBe('4 tbsp'));
  it('scales fractions', () => expect(scaleAmount('1/2 cup', 2)).toBe('1 cup'));
  it('renders quarter fractions', () => expect(scaleAmount('1 cup', 0.5)).toBe('½ cup'));
  it('renders mixed numbers', () => expect(scaleAmount('1 cup', 1.5)).toBe('1 ½ cup'));
  it('scales grams', () => expect(scaleAmount('800g', 0.5)).toBe('400g'));
  it('leaves text-only amounts alone', () => expect(scaleAmount('to taste', 3)).toBe('to taste'));
});
