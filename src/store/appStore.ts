import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { ApplianceTag, Filters, Recipe } from '../types';
import type { UnitSystem } from '../lib/units';
import {
  DEFAULT_PERSISTED, EMPTY_PLAN, sanitizePersisted,
  type PersistedState, type Stars, type DayKey, type Vote,
} from './persisted';

export { DAYS, DAY_LABELS, sanitizePersisted } from './persisted';
export type { PersistedState, Stars, DayKey, MealPlan, Vote } from './persisted';

type Updater<T> = T | ((prev: T) => T);
const apply = <T,>(u: Updater<T>, prev: T): T => (typeof u === 'function' ? (u as (p: T) => T)(prev) : u);

interface SessionState {
  /** Recipes other users generated — fetched fresh each session. */
  communityRecipes: Recipe[];
  /** Upvote counts for community recipes, by id. */
  communityUpvotes: Record<number, number>;
  /** Most recent swipe-left, for undo. */
  lastPassed: number | null;
  /** Device sync state for the UI. */
  syncStatus: 'off' | 'idle' | 'syncing' | 'error';
  lastSyncedAt: number | null;
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
  setCommunityRecipes: (list: Recipe[], upvotes?: Record<number, number>) => void;
  setUnits: (u: UnitSystem) => void;
  setExpiry: (ingredient: string, date: string | null) => void;
  /** Remove items from the pantry (e.g. used up while cooking). */
  removeFromPantry: (items: string[]) => void;
  addToPlan: (day: DayKey, id: number) => void;
  removeFromPlan: (day: DayKey, id: number) => void;
  clearPlan: () => void;
  setSyncCode: (code: string | null) => void;
  setSyncStatus: (status: AppState['syncStatus'], lastSyncedAt?: number) => void;
  setVote: (id: number, vote: Vote) => void;
  /** Replace all persisted data (used by device sync). */
  importState: (data: PersistedState) => void;
}

export type AppState = PersistedState & SessionState & Actions;

export const STORE_KEY = 'recipesy-state';
export const STORE_VERSION = 2;

// Before the store existed, each field lived under its own localStorage key.
const LEGACY_KEYS: Partial<Record<keyof PersistedState, string>> = {
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
      communityUpvotes: {},
      lastPassed: null,
      syncStatus: 'off',
      lastSyncedAt: null,

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
      setCommunityRecipes: (list, upvotes = {}) => set({ communityRecipes: list, communityUpvotes: upvotes }),
      setUnits: (units) => set({ units }),
      setExpiry: (ing, date) => set((s) => {
        const next = { ...s.pantryExpiry };
        if (date) next[ing] = date; else delete next[ing];
        return { pantryExpiry: next };
      }),
      removeFromPantry: (items) => set((s) => {
        const drop = new Set(items);
        const pantryExpiry = { ...s.pantryExpiry };
        items.forEach((i) => delete pantryExpiry[i]);
        return { pantry: s.pantry.filter((p) => !drop.has(p)), pantryExpiry };
      }),
      addToPlan: (day, id) => set((s) => (s.mealPlan[day].includes(id) ? s : { mealPlan: { ...s.mealPlan, [day]: [...s.mealPlan[day], id] } })),
      removeFromPlan: (day, id) => set((s) => ({ mealPlan: { ...s.mealPlan, [day]: s.mealPlan[day].filter((x) => x !== id) } })),
      clearPlan: () => set({ mealPlan: EMPTY_PLAN }),
      setSyncCode: (syncCode) => set({ syncCode, syncStatus: syncCode ? 'idle' : 'off' }),
      setSyncStatus: (syncStatus, lastSyncedAt) => set((s) => ({ syncStatus, lastSyncedAt: lastSyncedAt ?? s.lastSyncedAt })),
      setVote: (id, vote) => set((s) => ({ votes: { ...s.votes, [id]: vote } })),
      importState: (data) => set(sanitizePersisted(data)),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): PersistedState => pickPersisted(s),
      // Future shape changes go here, keyed on the stored version.
      migrate: (persisted) => sanitizePersisted(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
);

/** The persisted slice of the state (what's saved locally and synced). */
export function pickPersisted(s: PersistedState): PersistedState {
  return {
    pantry: s.pantry, appliances: s.appliances, filters: s.filters, cookbook: s.cookbook,
    making: s.making, passed: s.passed, cooked: s.cooked, ratings: s.ratings, notes: s.notes,
    myAiRecipes: s.myAiRecipes, units: s.units, pantryExpiry: s.pantryExpiry, mealPlan: s.mealPlan,
    syncCode: s.syncCode, votes: s.votes,
  };
}

/** Keep tabs in sync: another tab writing the store rehydrates this one. */
export function syncAcrossTabs(): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORE_KEY) void useAppStore.persist.rehydrate();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
