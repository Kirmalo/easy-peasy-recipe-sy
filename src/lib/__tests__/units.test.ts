import { describe, it, expect } from 'vitest';
import { normalizeAmount, convertUnits } from '../units';
import { formatAmount } from '../scaleAmount';

describe('normalizeAmount', () => {
  it('tidies spacing and unit names', () => {
    expect(normalizeAmount('3  tablespoons')).toBe('3 tbsp');
    expect(normalizeAmount('200 grams')).toBe('200g');
    expect(normalizeAmount('1 Teaspoon')).toBe('1 tsp');
    expect(normalizeAmount('2 pounds')).toBe('2 lb');
  });
});

describe('convertUnits', () => {
  it('leaves amounts alone in original mode', () => expect(convertUnits('8 oz', 'original')).toBe('8 oz'));
  it.each([
    ['8 oz', '225g'],
    ['2 lb', '905g'],
    ['3 lb', '1.4kg'],
    ['1 cup', '240ml'],
    ['1 ½ cups', '360ml'],
  ])('%s → metric %s', (a, b) => expect(convertUnits(a, 'metric')).toBe(b));
  it.each([
    ['200g', '7 oz'],
    ['500g', '1 lb'],
    ['1kg', '2.25 lb'],
    ['250ml', '1 cup'],
    ['30ml', '2 tbsp'],
    ['5ml', '1 tsp'],
  ])('%s → imperial %s', (a, b) => expect(convertUnits(a, 'imperial')).toBe(b));
  it('keeps trailing description', () => expect(convertUnits('200g grated', 'imperial')).toBe('7 oz grated'));
  it('ignores amounts it cannot parse', () => {
    expect(convertUnits('handful', 'metric')).toBe('handful');
    expect(convertUnits('2 tbsp', 'metric')).toBe('2 tbsp');
  });
});

describe('formatAmount', () => {
  it('rounds scaled grams to whole numbers', () => expect(formatAmount('400g', 1 / 3, 'original')).toBe('135g'));
  it('scales then converts', () => expect(formatAmount('4 oz', 2, 'metric')).toBe('225g'));
});
