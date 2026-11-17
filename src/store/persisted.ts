// Pure schema + validation for persisted user data. No React / Zustand / DOM here,
// so the /api/sync route can validate uploads with the same rules.
import { DEFAULT_FILTERS } from '../data/defaults.js';
import { sanitizeRecipes } from '../lib/recipeValidation.js';
import type { ApplianceTag, Filters, Recipe } from '../types/index.js';
import type { UnitSystem } from '../lib/units.js';
import { normalizeSyncCode } from '../lib/syncCode.js';

export type Stars = 1 | 2 | 3;

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAYS)[number];
export const DAY_LABELS: Record<DayKey, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export type MealPlan = Record<DayKey, number[]>;
export type Vote = 'up' | 'report';
export const EMPTY_PLAN: MealPlan = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

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
  /** How ingredient amounts are displayed. */
  units: UnitSystem;
  /** Pantry item → ISO date (YYYY-MM-DD) it should be used by. */
  pantryExpiry: Record<string, string>;
  /** Recipes planned for each day of the week. */
  mealPlan: MealPlan;
  /** Device-sync code, when sync is enabled. */
  syncCode: string | null;
  /** Votes cast on community recipes, so each device votes once. */
  votes: Record<number, Vote>;
}

export const DEFAULT_PERSISTED: PersistedState = {
  pantry: [], appliances: [], filters: DEFAULT_FILTERS, cookbook: [], making: [],
  passed: [], cooked: [], ratings: {}, notes: {}, myAiRecipes: [],
  units: 'original', pantryExpiry: {}, mealPlan: EMPTY_PLAN, syncCode: null, votes: {},
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
const isIsoDate = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isVote = (x: unknown): x is Vote => x === 'up' || x === 'report';

function sanitizePlan(v: unknown): MealPlan {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return Object.fromEntries(DAYS.map((d) => [d, ids(o[d]).slice(0, 10)])) as MealPlan;
}

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
    units: o.units === 'metric' || o.units === 'imperial' ? o.units : 'original',
    pantryExpiry: Object.fromEntries(
      Object.entries(o.pantryExpiry && typeof o.pantryExpiry === 'object' ? o.pantryExpiry : {}).filter(([, d]) => isIsoDate(d)),
    ) as Record<string, string>,
    mealPlan: sanitizePlan(o.mealPlan),
    syncCode: typeof o.syncCode === 'string' ? normalizeSyncCode(o.syncCode) : null,
    votes: record(o.votes, isVote),
  };
}


const union = (a: number[], b: number[]): number[] => [...new Set([...a, ...b])];

/**
 * Combines a newer remote snapshot with local changes made since the last sync, so a
 * conflict doesn't drop either side: lists are unioned, per-recipe records prefer local,
 * and settings (filters, units) follow the local device.
 */
export function mergePersisted(remote: PersistedState, local: PersistedState): PersistedState {
  const byId = new Map(remote.myAiRecipes.map((r) => [r.id, r]));
  local.myAiRecipes.forEach((r) => byId.set(r.id, r));
  return sanitizePersisted({
    ...local,
    pantry: [...new Set([...remote.pantry, ...local.pantry])],
    appliances: [...new Set([...remote.appliances, ...local.appliances])],
    cookbook: union(remote.cookbook, local.cookbook),
    making: union(remote.making, local.making),
    passed: union(remote.passed, local.passed),
    cooked: union(local.cooked, remote.cooked),
    ratings: { ...remote.ratings, ...local.ratings },
    notes: { ...remote.notes, ...local.notes },
    votes: { ...remote.votes, ...local.votes },
    pantryExpiry: { ...remote.pantryExpiry, ...local.pantryExpiry },
    mealPlan: Object.fromEntries(DAYS.map((d) => [d, union(remote.mealPlan[d], local.mealPlan[d])])),
    myAiRecipes: [...byId.values()],
  });
}
