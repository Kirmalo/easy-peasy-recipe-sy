import { convertUnits, normalizeAmount, type UnitSystem } from './units';

// Grams / millilitres read better as whole numbers than as "133 ¼g".
const METRIC_AFTER = /^\s*(g|kg|ml|l)\b/i;

export function scaleAmount(amount: string, factor: number): string {
  if (factor === 1) return amount;
  return amount.replace(/\d+\/\d+|\d+\.?\d*/g, (match, offset: number, whole: string) => {
    let n: number;
    if (match.includes('/')) {
      const [num, den] = match.split('/').map(Number);
      n = num / den;
    } else {
      n = parseFloat(match);
    }
    const scaled = n * factor;
    if (METRIC_AFTER.test(whole.slice(offset + match.length))) {
      const step = scaled >= 50 ? 5 : 1;
      return String(Math.max(step, Math.round(scaled / step) * step));
    }
    if (scaled % 1 === 0) return String(scaled);
    const rounded = Math.round(scaled * 4) / 4;
    const frac = rounded % 1;
    const wholePart = Math.floor(rounded);
    const fracStr = frac < 0.3 ? '¼' : frac < 0.55 ? '½' : frac < 0.8 ? '¾' : '1';
    if (fracStr === '1') return String(wholePart + 1);
    return wholePart > 0 ? `${wholePart} ${fracStr}` : fracStr;
  });
}

/** Display pipeline for an amount: tidy → scale to servings → convert units. */
export function formatAmount(amount: string, factor: number, system: UnitSystem): string {
  return convertUnits(scaleAmount(normalizeAmount(amount), factor), system);
}
