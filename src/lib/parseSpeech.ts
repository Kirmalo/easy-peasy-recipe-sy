export const parseSpokenIngredients = (text: string): string[] => {
  if (!text) return [];
  let t = ' ' + text.toLowerCase() + ' ';

  const fillerPhrases = [
    /\b(i have got|i have|i've got|i got|i've|let me see|let's see|so i have|so i've got|in my fridge|in my pantry|in my kitchen|i think i have|i think i've got|there's|there is|there are)\b/g,
    /\b(also|plus|along with|together with)\b/g,
    /\b(some|a bit of|a little bit of|a little|a few|a couple of|lots of|a lot of|loads of)\b/g,
    /\b(um|uh|er|okay|ok|well|yeah|like)\b/g,
  ];
  fillerPhrases.forEach((re) => { t = t.replace(re, ' '); });

  const parts = t.split(/,|;|\.| and | then /);
  return parts
    .map((p) => p.trim().replace(/[.!?]+$/, '').replace(/\s+/g, ' '))
    .filter((p) => p.length >= 2 && /[a-z]/.test(p));
};
