import { describe, it, expect } from 'vitest';
import { normalizeSyncCode } from '../syncCode';

describe('normalizeSyncCode', () => {
  it('accepts spaced, lower-case or unhyphenated input', () => {
    expect(normalizeSyncCode('abcd efgh jkmn')).toBe('ABCD-EFGH-JKMN');
    expect(normalizeSyncCode('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN');
    expect(normalizeSyncCode(' abcd-efgh-jkmn ')).toBe('ABCD-EFGH-JKMN');
  });
  it('rejects wrong length or ambiguous characters', () => {
    expect(normalizeSyncCode('ABCD-EFGH')).toBeNull();
    expect(normalizeSyncCode('ABCD-EFGH-JKM0')).toBeNull(); // 0 is not in the alphabet
    expect(normalizeSyncCode('')).toBeNull();
  });
});
