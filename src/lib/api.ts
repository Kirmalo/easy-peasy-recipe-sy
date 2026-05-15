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

const imageCache = new Map<number, string | null>();
const imageInflight = new Map<number, Promise<string | null>>();

export async function fetchRecipeImage(recipeId: number): Promise<string | null> {
  if (imageCache.has(recipeId)) return imageCache.get(recipeId) ?? null;
  if (imageInflight.has(recipeId)) return imageInflight.get(recipeId) ?? null;

  const queries = RECIPE_QUERIES[recipeId] ?? [];
  const promise: Promise<string | null> = (async () => {
    for (const q of queries) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { meals?: Array<{ strMealThumb: string }> | null };
        const meals = data?.meals;
        if (meals && meals.length > 0 && meals[0].strMealThumb) {
          imageCache.set(recipeId, meals[0].strMealThumb);
          return meals[0].strMealThumb;
        }
      } catch {
        // try next query
      }
    }
    imageCache.set(recipeId, null);
    return null;
  })();

  imageInflight.set(recipeId, promise);
  return promise;
}

export { imageCache };
