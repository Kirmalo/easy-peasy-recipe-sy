import { describe, it, expect } from 'vitest';
import { detectSeconds, formatTime, secondsLeft } from '../timer';

describe('detectSeconds', () => {
  it.each([
    ['Simmer for 10 minutes.', 600],
    ['Bake 25-30 mins until golden', 1500],
    ['Rest for 1 hour', 3600],
    ['Microwave 30 seconds', 30],
    ['Cook 10 to 12 minutes', 600],
  ])('%s → %i', (text, secs) => expect(detectSeconds(text)).toBe(secs));

  it('ignores steps without a duration', () => expect(detectSeconds('Add 2 eggs and whisk')).toBeNull());
  it('does not read "minced" as minutes', () => expect(detectSeconds('Add 3 minced garlic cloves')).toBeNull());
});

describe('formatTime', () => {
  it('formats minutes and seconds', () => expect(formatTime(65)).toBe('1:05'));
  it('formats hours', () => expect(formatTime(3725)).toBe('1:02:05'));
});

describe('secondsLeft', () => {
  it('rounds up and never goes negative', () => {
    expect(secondsLeft(10_500, 10_000)).toBe(1);
    expect(secondsLeft(10_000, 12_000)).toBe(0);
  });
});
