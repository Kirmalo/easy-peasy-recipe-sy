export function scaleAmount(amount: string, factor: number): string {
  if (factor === 1) return amount;
  return amount.replace(/\d+\/\d+|\d+\.?\d*/g, (match) => {
    let n: number;
    if (match.includes('/')) {
      const [num, den] = match.split('/').map(Number);
      n = num / den;
    } else {
      n = parseFloat(match);
    }
    const scaled = n * factor;
    if (scaled % 1 === 0) return String(scaled);
    const rounded = Math.round(scaled * 4) / 4;
    const frac = rounded % 1;
    const whole = Math.floor(rounded);
    const fracStr = frac < 0.3 ? '¼' : frac < 0.55 ? '½' : frac < 0.8 ? '¾' : '1';
    if (fracStr === '1') return String(whole + 1);
    return whole > 0 ? `${whole} ${fracStr}` : fracStr;
  });
}
