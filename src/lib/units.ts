export type UnitSystem = 'original' | 'metric' | 'imperial';

const UNIT_ALIASES: Array<[RegExp, string]> = [
  [/\b(tablespoons?|tbsps?|tbls?)\b\.?/gi, 'tbsp'],
  [/\b(teaspoons?|tsps?)\b\.?/gi, 'tsp'],
  [/\b(grams?|gr|gms?)\b\.?/gi, 'g'],
  [/\b(kilograms?|kilos?|kgs)\b\.?/gi, 'kg'],
  [/\b(millilit(?:er|re)s?|mls)\b\.?/gi, 'ml'],
  [/\b(lit(?:er|re)s?)\b\.?/gi, 'l'],
  [/\b(ounces?|ozs)\b\.?/gi, 'oz'],
  [/\b(pounds?|lbs)\b\.?/gi, 'lb'],
  [/\bfluid oz\b/gi, 'fl oz'],
];

/** Tidies spacing and unit names: "3  tablespoons" → "3 tbsp". */
export function normalizeAmount(amount: string): string {
  let a = amount.replace(/\s+/g, ' ').trim();
  for (const [re, rep] of UNIT_ALIASES) a = a.replace(re, rep);
  return a.replace(/(\d)\s+(g|kg|ml)\b/g, '$1$2');
}

const UNICODE_FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
const QTY = String.raw`(\d+\s+\d+\/\d+|\d+\s*[¼½¾⅓⅔⅛]|\d+\/\d+|\d+(?:\.\d+)?|[¼½¾⅓⅔⅛])`;
const AMOUNT_RE = new RegExp(String.raw`^${QTY}\s*(fl oz|g|kg|ml|l|oz|lb|cups?)\b(.*)$`, 'i');

function parseQty(q: string): number {
  q = q.trim();
  const uni = q.match(/^(\d+)?\s*([¼½¾⅓⅔⅛])$/);
  if (uni) return Number(uni[1] ?? 0) + UNICODE_FRACTIONS[uni[2]];
  const mixed = q.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = q.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(q);
}

const fmt = (n: number, step: number): string => {
  const r = Math.max(step, Math.round(n / step) * step);
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};
const fmtCups = (cups: number): string => {
  const q = Math.round(cups * 4) / 4;
  const whole = Math.floor(q);
  const frac = ['', '¼', '½', '¾'][Math.round((q - whole) * 4)];
  return `${whole || ''}${whole && frac ? ' ' : ''}${frac}` || '¼';
};

const toMetric = (n: number, unit: string): string | null => {
  switch (unit) {
    case 'oz': { const g = n * 28.35; return g >= 1000 ? `${fmt(g / 1000, 0.1)}kg` : `${fmt(g, g > 50 ? 5 : 1)}g`; }
    case 'lb': { const g = n * 453.6; return g >= 1000 ? `${fmt(g / 1000, 0.1)}kg` : `${fmt(g, 5)}g`; }
    case 'cup': case 'cups': { const ml = n * 240; return ml >= 1000 ? `${fmt(ml / 1000, 0.1)}l` : `${fmt(ml, 5)}ml`; }
    case 'fl oz': return `${fmt(n * 29.57, 5)}ml`;
    default: return null;
  }
};

const toImperial = (n: number, unit: string): string | null => {
  switch (unit) {
    case 'g': { const oz = n / 28.35; return oz >= 16 ? `${fmt(oz / 16, 0.25)} lb` : `${fmt(oz, oz < 2 ? 0.25 : 0.5)} oz`; }
    case 'kg': return `${fmt((n * 1000) / 453.6, 0.25)} lb`;
    case 'ml': {
      if (n < 15) return `${fmt(n / 5, 0.25)} tsp`;
      if (n < 60) return `${fmt(n / 15, 0.5)} tbsp`;
      return `${fmtCups(n / 240)} cup${n / 240 > 1.1 ? 's' : ''}`;
    }
    case 'l': return `${fmtCups((n * 1000) / 240)} cups`;
    default: return null;
  }
};

/** Converts a single leading quantity+unit ("200g pasta") into the chosen system; otherwise unchanged. */
export function convertUnits(amount: string, system: UnitSystem): string {
  if (system === 'original') return amount;
  const m = amount.match(AMOUNT_RE);
  if (!m) return amount;
  const n = parseQty(m[1]);
  if (!Number.isFinite(n) || n <= 0) return amount;
  const unit = m[2].toLowerCase();
  const converted = system === 'metric' ? toMetric(n, unit) : toImperial(n, unit);
  return converted ? `${converted}${m[3]}` : amount;
}
