/** First duration mentioned in a recipe step ("simmer 10–15 minutes" → 600), or null. */
export function detectSeconds(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:(?:to|-|–)\s*\d+\s*)?(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  if (!val) return null;
  const unit = match[2].toLowerCase();
  if (unit.startsWith('hour') || unit.startsWith('hr')) return val * 3600;
  if (unit.startsWith('min')) return val * 60;
  return val;
}

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? m.toString().padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${sec.toString().padStart(2, '0')}`;
}

/** Seconds left on a wall-clock timer, rounded up so "0:00" only shows at the end. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
