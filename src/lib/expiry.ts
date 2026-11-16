/** Local calendar date as YYYY-MM-DD. */
export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Whole days from `today` until `date` (negative when past). */
export function daysUntil(date: string, today: Date = new Date()): number {
  const [y, m, d] = date.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / 86_400_000);
}

/** Pantry items with a use-by date within `withinDays` (including overdue), soonest first. */
export function soonToExpire(pantry: string[], expiry: Record<string, string>, withinDays: number, today: Date = new Date()): string[] {
  return pantry
    .filter((p) => expiry[p] && daysUntil(expiry[p], today) <= withinDays)
    .sort((a, b) => daysUntil(expiry[a], today) - daysUntil(expiry[b], today));
}

export function expiryLabel(date: string, today: Date = new Date()): string {
  const n = daysUntil(date, today);
  if (n < 0) return n === -1 ? 'expired yesterday' : `expired ${-n} days ago`;
  if (n === 0) return 'use today';
  if (n === 1) return 'use tomorrow';
  return `use within ${n} days`;
}
