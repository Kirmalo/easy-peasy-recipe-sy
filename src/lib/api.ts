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

const imageCache = new Map<number, string | null>();
const imageInflight = new Map<number, Promise<string | null>>();

// Pre-populate from sessionStorage so images are instant on page reload.
try {
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(SESSION_PREFIX)) {
      const id = parseInt(key.slice(SESSION_PREFIX.length), 10);
      if (!isNaN(id)) {
        const raw = sessionStorage.getItem(key);
        imageCache.set(id, raw === 'null' ? null : raw);
      }
    }
  }
} catch { /* private browsing / storage unavailable */ }

async function fetchFromPixabay(query: string): Promise<string | null> {
  const key = import.meta.env.VITE_PIXABAY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&category=food&per_page=3&safesearch=true&min_width=400`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { hits?: Array<{ webformatURL: string }> };
    return data?.hits?.[0]?.webformatURL ?? null;
  } catch {
    return null;
  }
}

export async function fetchRecipeImage(recipeId: number, searchName?: string): Promise<string | null> {
  if (imageCache.has(recipeId)) return imageCache.get(recipeId) ?? null;
  if (imageInflight.has(recipeId)) return imageInflight.get(recipeId) ?? null;

  // Use explicit query list, or fall back to searching by recipe name
  const queries = RECIPE_QUERIES[recipeId] ?? (searchName ? [searchName] : []);

  const promise: Promise<string | null> = (async () => {
    // 1. Try TheMealDB
    for (const q of queries) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { meals?: Array<{ strMealThumb: string }> | null };
        const url = data?.meals?.[0]?.strMealThumb ?? null;
        if (url) {
          imageCache.set(recipeId, url);
          try { sessionStorage.setItem(`${SESSION_PREFIX}${recipeId}`, url); } catch { /* quota */ }
          return url;
        }
      } catch {
        // try next query
      }
    }

    // 2. Fall back to Pixabay when TheMealDB has nothing
    if (searchName) {
      const url = await fetchFromPixabay(searchName);
      if (url) {
        imageCache.set(recipeId, url);
        try { sessionStorage.setItem(`${SESSION_PREFIX}${recipeId}`, url); } catch { /* quota */ }
        return url;
      }
    }

    imageCache.set(recipeId, null);
    try { sessionStorage.setItem(`${SESSION_PREFIX}${recipeId}`, 'null'); } catch { /* quota */ }
    return null;
  })();

  imageInflight.set(recipeId, promise);
  return promise;
}

export { imageCache };
