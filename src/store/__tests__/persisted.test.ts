import { describe, it, expect } from 'vitest';
import { mergePersisted, sanitizePersisted } from '../persisted';

describe('mergePersisted', () => {
  it('keeps both sides of a conflict', () => {
    const remote = sanitizePersisted({ pantry: ['eggs'], cookbook: [1, 2], ratings: { 1: 2 }, notes: { 2: 'remote' }, units: 'metric', mealPlan: { mon: [5] } });
    const local = sanitizePersisted({ pantry: ['milk'], cookbook: [2, 3], ratings: { 1: 3 }, notes: {}, units: 'imperial', mealPlan: { mon: [6], tue: [7] } });
    const m = mergePersisted(remote, local);
    expect(m.pantry).toEqual(['eggs', 'milk']);
    expect(m.cookbook).toEqual([1, 2, 3]);
    expect(m.ratings).toEqual({ 1: 3 }); // local wins per record
    expect(m.notes).toEqual({ 2: 'remote' });
    expect(m.units).toBe('imperial'); // settings follow this device
    expect(m.mealPlan.mon).toEqual([5, 6]);
    expect(m.mealPlan.tue).toEqual([7]);
  });
});
