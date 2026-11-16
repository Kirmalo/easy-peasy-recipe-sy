import { describe, it, expect } from 'vitest';
import { parseRoute, pathFor } from '../router';

describe('router', () => {
  it('parses tab paths', () => {
    expect(parseRoute('/', null)).toEqual({ view: 'kitchen', detailId: null, cookId: null });
    expect(parseRoute('/cookbook', null).view).toBe('cookbook');
    expect(parseRoute('/cooking/', null).view).toBe('making');
    expect(parseRoute('/nope', null).view).toBe('kitchen');
  });
  it('parses overlays and keeps the tab from history state', () => {
    expect(parseRoute('/recipe/42', null)).toEqual({ view: 'discover', detailId: 42, cookId: null });
    expect(parseRoute('/recipe/42', { tab: 'cookbook' }).view).toBe('cookbook');
    expect(parseRoute('/cook/7', null)).toEqual({ view: 'making', detailId: null, cookId: 7 });
    expect(parseRoute('/recipe/abc', null).detailId).toBeNull();
  });
  it('round-trips', () => {
    for (const r of [
      { view: 'discover', detailId: null, cookId: null },
      { view: 'discover', detailId: 53262, cookId: null },
      { view: 'making', detailId: null, cookId: 9000001 },
    ] as const) {
      expect(parseRoute(pathFor(r), { tab: r.view })).toEqual(r);
    }
  });
});
