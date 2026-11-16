import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { DEFAULT_FILTERS } from '../data/defaults';
import { sanitizeRecipes } from '../lib/recipeValidation';
import type { ApplianceTag, Filters, Recipe } from '../types';

export type Stars = 1 | 2 | 3;
type Updater<T> = T | ((prev: T) => T);
const apply = <T,>(u: Updater<T>, prev: T): T => (typeof u === 'function' ? (u as (p: T) => T)(prev) : u);

/** Everything that survives a reload. Bump STORE_VERSION and extend `migrate` when this shape changes. */
export interface PersistedState {
  pantry: string[];
  appliances: ApplianceTag[];
  filters: Filters;
  cookbook: number[];
  making: number[];
  passed: number[];
  cooked: number[];
  ratings: Record<number, Stars>;
  notes: Record<number, string>;
  /** AI recipes this user generated, so saved/cooked ones survive reloads. */
  myAiRecipes: Recipe[];
}

interface SessionState {
  /** Recipes other users generated — fetched fresh each session. */
  communityRecipes: Recipe[];
  /** Most recent swipe-left, for undo. */
  lastPassed: number | null;
}

interface Actions {
  setPantry: (u: Updater<string[]>) => void;
  addToPantry: (ing: string) => void;
  setAppliances: (u: Updater<ApplianceTag[]>) => void;
  setFilters: (u: Updater<Filters>) => void;
  addToCookbook: (id: number) => void;
  removeFromCookbook: (id: number) => void;
  addToMaking: (id: number) => void;
  removeFromMaking: (id: number) => void;
  addToPassed: (id: number) => void;
  undoPass: () => void;
  /** Hide the undo prompt without undoing. */
  clearUndo: () => void;
  resetPassed: () => void;
  /** Finished cooking: record in history and take it off the "making" list. */
  markCooked: (id: number) => void;
  setRating: (id: number, stars: Stars) => void;
  setNote: (id: number, text: string) => void;
  addAiRecipe: (r: Recipe) => void;
  setCommunityRecipes: (list: Recipe[]) => void;
}

export type AppState = PersistedState & SessionState & Actions;

export const STORE_KEY = 'recipesy-state';
export const STORE_VERSION = 1;

const DEFAULT_PERSISTED: PersistedState = {
  pantry: [], appliances: [], filters: DEFAULT_FILTERS, cookbook: [], making: [],
  passed: [], cooked: [], ratings: {}, notes: {}, myAiRecipes: [],
};

// ── Validation: storage can hold anything (old versions, manual edits, other tabs) ──

const ids = (v: unknown): number[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is number => Number.isSafeInteger(x)))] : [];
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
const record = <T,>(v: unknown, ok: (x: unknown) => x is T): Record<number, T> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v).filter(([k, x]) => Number.isSafeInteger(Number(k)) && ok(x))) as Record<number, T>;
};
const isStars = (x: unknown): x is Stars => x === 1 || x === 2 || x === 3;
const isString = (x: unknown): x is string => typeof x === 'string';

export function sanitizePersisted(raw: unknown): PersistedState {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const f = (o.filters && typeof o.filters === 'object' ? o.filters : {}) as Partial<Filters>;
  return {
    pantry: strings(o.pantry),
    appliances: strings(o.appliances) as ApplianceTag[],
    filters: { ...DEFAULT_FILTERS, ...f, dietary: Array.isArray(f.dietary) ? f.dietary : [] },
    cookbook: ids(o.cookbook),
    making: ids(o.making),
    passed: ids(o.passed).slice(-500),
    cooked: ids(o.cooked).slice(0, 100),
    ratings: record(o.ratings, isStars),
    notes: record(o.notes, isString),
    myAiRecipes: sanitizeRecipes(o.myAiRecipes).slice(0, 200),
  };
}

// Before the store existed, each field lived under its own localStorage key.
const LEGACY_KEYS: Record<keyof PersistedState, string> = {
  pantry: 'pantry', appliances: 'appliances', filters: 'filters', cookbook: 'cookbook', making: 'making',
  passed: 'passed', cooked: 'cooked', ratings: 'ratings', notes: 'notes', myAiRecipes: 'aiRecipes',
};

function readLegacy(): PersistedState | null {
  try {
    const out: Record<string, unknown> = {};
    let found = false;
    for (const [field, key] of Object.entries(LEGACY_KEYS)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) { found = true; out[field] = JSON.parse(raw); }
    }
    return found ? sanitizePersisted(out) : null;
  } catch {
    return null;
  }
}

/** localStorage that falls back to legacy per-field keys the first time, and never throws. */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const v = localStorage.getItem(name);
      if (v !== null) return v;
      const legacy = readLegacy();
      return legacy ? JSON.stringify({ state: legacy, version: STORE_VERSION }) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try { localStorage.setItem(name, value); } catch { /* quota / private mode — keep in-memory state */ }
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name); } catch { /* ignore */ }
  },
};

const without = <T,>(rec: Record<number, T>, id: number): Record<number, T> => {
  const next = { ...rec };
  delete next[id];
  return next;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULT_PERSISTED,
      communityRecipes: [],
      lastPassed: null,

      setPantry: (u) => set((s) => ({ pantry: apply(u, s.pantry) })),
      addToPantry: (ing) => set((s) => (s.pantry.includes(ing) ? s : { pantry: [...s.pantry, ing] })),
      setAppliances: (u) => set((s) => ({ appliances: apply(u, s.appliances) })),
      setFilters: (u) => set((s) => ({ filters: apply(u, s.filters) })),

      addToCookbook: (id) => set((s) => (s.cookbook.includes(id) ? s : { cookbook: [...s.cookbook, id] })),
      removeFromCookbook: (id) => set((s) => ({ cookbook: s.cookbook.filter((x) => x !== id) })),
      addToMaking: (id) => set((s) => (s.making.includes(id) ? s : { making: [...s.making, id] })),
      removeFromMaking: (id) => set((s) => ({ making: s.making.filter((x) => x !== id) })),

      addToPassed: (id) => set((s) => (s.passed.includes(id) ? s : { passed: [...s.passed, id].slice(-500), lastPassed: id })),
      undoPass: () => set((s) => (s.lastPassed === null ? s : { passed: s.passed.filter((x) => x !== s.lastPassed), lastPassed: null })),
      clearUndo: () => set({ lastPassed: null }),
      resetPassed: () => set({ passed: [], lastPassed: null }),

      markCooked: (id) => set((s) => ({
        cooked: [id, ...s.cooked.filter((x) => x !== id)].slice(0, 100),
        making: s.making.filter((x) => x !== id),
      })),
      setRating: (id, stars) => set((s) => ({ ratings: { ...s.ratings, [id]: stars } })),
      setNote: (id, text) => set((s) => ({ notes: text.trim() ? { ...s.notes, [id]: text } : without(s.notes, id) })),

      addAiRecipe: (r) => set((s) => ({ myAiRecipes: [r, ...s.myAiRecipes.filter((x) => x.id !== r.id)].slice(0, 200) })),
      setCommunityRecipes: (list) => set({ communityRecipes: list }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): PersistedState => ({
        pantry: s.pantry, appliances: s.appliances, filters: s.filters, cookbook: s.cookbook,
        making: s.making, passed: s.passed, cooked: s.cooked, ratings: s.ratings, notes: s.notes,
        myAiRecipes: s.myAiRecipes,
      }),
      // Future shape changes go here, keyed on the stored version.
      migrate: (persisted) => sanitizePersisted(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
);

/** Keep tabs in sync: another tab writing the store rehydrates this one. */
export function syncAcrossTabs(): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORE_KEY) void useAppStore.persist.rehydrate();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
