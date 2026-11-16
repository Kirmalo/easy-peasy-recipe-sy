const RECIPE_QUERIES: Record<number, string[]> = {
  1:  ['Spaghetti', 'Pasta', 'Carbonara'],
  2:  ['Bruschetta', 'Tomato bread'],
  3:  ['Lemon Chicken', 'Roast Chicken', 'Chicken'],
  4:  ['Stir Fry', 'Vegetable Stir Fry', 'Beef Stroganoff'],
  5:  ['Grilled Cheese', 'Cheese Toast', 'Cheese'],
  6:  ['Mushroom Risotto', 'Risotto'],
  7:  ['Avocado', 'Toast', 'Salmon Avocado'],
  8:  ['Fried rice', 'Egg Drop Soup', 'Rice'],
  9:  ['Caprese', 'Mozzarella', 'Tomato Salad'],
  10: ['Curry', 'Chickpea', 'Chana'],
  11: ['Pancakes', 'Banana Pancakes'],
  12: ['Tuna', 'Tuna Melt', 'Tuna Salad'],
  13: ['Pesto', 'Pesto Pasta'],
  14: ['Roasted Vegetables', 'Vegetables', 'Ratatouille'],
  15: ['Lentil Soup', 'Lentils', 'Dal'],
  16: ['Greek Salad', 'Greek'],
  17: ['Tacos', 'Beef Tacos', 'Beef'],
  18: ['Steak', 'Beef Steak', 'Chimichurri'],
  19: ['Mozzarella Sandwich', 'Sandwich', 'Caprese'],
  20: ['Omelette', 'Frittata', 'Egg'],
  21: ['Tomato Soup', 'Soup'],
  22: ['Shrimp', 'Prawn', 'Garlic Shrimp'],
  23: ['Quesadilla', 'Cheese Wrap'],
  24: ['Salmon', 'Honey Salmon', 'Teriyaki Salmon'],
  25: ['Chocolate Cake', 'Chocolate', 'Brownie'],
};

const SESSION_PREFIX = 'ep_img_';
/** How long a "no image found" result is trusted before trying again. */
const MISS_TTL_MS = 10 * 60 * 1000;

/** Found image URLs only. */
const imageCache = new Map<number, string>();
/** recipeId → time of last confirmed miss. In memory only, so a reload always retries. */
const missCache = new Map<number, number>();
const imageInflight = new Map<number, Promise<string | null>>();

// Pre-populate from sessionStorage so images are instant on page reload.
try {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(SESSION_PREFIX)) {
      const id = parseInt(key.slice(SESSION_PREFIX.length), 10);
      const raw = sessionStorage.getItem(key);
      if (!isNaN(id) && raw && raw !== 'null') imageCache.set(id, raw);
    }
  }
} catch { /* private browsing / storage unavailable */ }

function remember(recipeId: number, url: string): string {
  imageCache.set(recipeId, url);
  try { sessionStorage.setItem(`${SESSION_PREFIX}${recipeId}`, url); } catch { /* quota */ }
  return url;
}

/** Same-origin image proxy (Pixabay search runs server-side; see api/recipe-image.ts). */
export const proxiedImageUrl = (query: string): string =>
  `/api/recipe-image?q=${encodeURIComponent(query.slice(0, 80))}`;

export async function fetchRecipeImage(recipeId: number, searchName?: string): Promise<string | null> {
  const hit = imageCache.get(recipeId);
  if (hit) return hit;
  const missedAt = missCache.get(recipeId);
  if (missedAt && Date.now() - missedAt < MISS_TTL_MS) return null;
  const pending = imageInflight.get(recipeId);
  if (pending) return pending;

  // Use explicit query list, or fall back to searching by recipe name
  const queries = RECIPE_QUERIES[recipeId] ?? (searchName ? [searchName] : []);

  const promise: Promise<string | null> = (async () => {
    let networkError = false;
    // 1. Try TheMealDB
    for (const q of queries) {
      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
        if (!res.ok) { networkError = true; continue; }
        const data = (await res.json()) as { meals?: Array<{ strMealThumb: string }> | null };
        const url = data?.meals?.[0]?.strMealThumb;
        if (url) return remember(recipeId, url);
      } catch {
        networkError = true; // offline / blocked — don't treat as a real miss
      }
    }

    // 2. Fall back to the image proxy; the <img> onError fallback handles a 404 there.
    if (searchName) return remember(recipeId, proxiedImageUrl(searchName));

    if (!networkError) missCache.set(recipeId, Date.now());
    return null;
  })().finally(() => imageInflight.delete(recipeId));

  imageInflight.set(recipeId, promise);
  return promise;
}

export { imageCache };
