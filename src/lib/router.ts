import type { ViewId } from '../types';

/** What the URL encodes: the active tab plus at most one full-screen overlay. */
export interface Route {
  view: ViewId;
  detailId: number | null;
  cookId: number | null;
}

/** Stored in history.state so Back knows which tab sits under an overlay. */
export interface HistoryState {
  tab: ViewId;
  /** True when this entry was pushed by the app on top of a tab entry. */
  pushedOverlay?: boolean;
}

const TAB_PATHS: Record<ViewId, string> = {
  kitchen: '',
  discover: 'discover',
  cookbook: 'cookbook',
  making: 'cooking',
};
const PATH_TABS = Object.fromEntries(Object.entries(TAB_PATHS).map(([k, v]) => [v, k as ViewId]));

const base = (): string => (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');

const isTab = (v: unknown): v is ViewId => typeof v === 'string' && v in TAB_PATHS;

export function parseRoute(pathname: string, state: unknown): Route {
  const b = base();
  const rel = (pathname.startsWith(b) ? pathname.slice(b.length) : pathname.replace(/^\//, '')).replace(/\/$/, '');
  const [head, arg] = rel.split('/');
  const tab = state && typeof state === 'object' && isTab((state as HistoryState).tab) ? (state as HistoryState).tab : null;
  const id = arg && /^\d+$/.test(arg) ? Number(arg) : null;

  if (head === 'recipe' && id !== null) return { view: tab ?? 'discover', detailId: id, cookId: null };
  if (head === 'cook' && id !== null) return { view: tab ?? 'making', detailId: null, cookId: id };
  return { view: PATH_TABS[head] ?? 'kitchen', detailId: null, cookId: null };
}

export function pathFor(route: Route): string {
  if (route.cookId !== null) return `${base()}cook/${route.cookId}`;
  if (route.detailId !== null) return `${base()}recipe/${route.detailId}`;
  return base() + TAB_PATHS[route.view];
}

/** Absolute, shareable link to a recipe. */
export const recipeUrl = (id: number): string =>
  `${window.location.origin}${pathFor({ view: 'discover', detailId: id, cookId: null })}`;
