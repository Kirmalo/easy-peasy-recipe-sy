import { describe, it, expect } from 'vitest';
import { daysUntil, soonToExpire, expiryLabel, isoDate } from '../expiry';

const today = new Date(2026, 10, 16); // 16 Nov 2026, local

describe('expiry', () => {
  it('counts calendar days', () => {
    expect(daysUntil('2026-11-16', today)).toBe(0);
    expect(daysUntil('2026-11-19', today)).toBe(3);
    expect(daysUntil('2026-11-14', today)).toBe(-2);
    expect(isoDate(today)).toBe('2026-11-16');
  });
  it('lists items expiring soon, soonest first', () => {
    const pantry = ['milk', 'rice', 'spinach', 'eggs'];
    const exp = { milk: '2026-11-18', spinach: '2026-11-15', rice: '2027-01-01' };
    expect(soonToExpire(pantry, exp, 3, today)).toEqual(['spinach', 'milk']);
  });
  it('labels', () => {
    expect(expiryLabel('2026-11-16', today)).toBe('use today');
    expect(expiryLabel('2026-11-17', today)).toBe('use tomorrow');
    expect(expiryLabel('2026-11-13', today)).toBe('expired 3 days ago');
  });
});
