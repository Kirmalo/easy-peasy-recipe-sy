import { useState, useEffect } from 'react';
import { fetchRecipeImage, imageCache } from '../lib/api';

export function useRecipeImage(recipeId: number, searchName?: string): string | null {
  // Holds the result of the latest fetch, tagged with the id it belongs to.
  const [fetched, setFetched] = useState<{ id: number; url: string | null } | null>(null);

  useEffect(() => {
    if (imageCache.has(recipeId)) return;
    let cancelled = false;
    fetchRecipeImage(recipeId, searchName).then((url) => {
      if (!cancelled) setFetched({ id: recipeId, url });
    });
    return () => { cancelled = true; };
  }, [recipeId, searchName]);

  const cached = imageCache.get(recipeId);
  if (cached) return cached;
  return fetched?.id === recipeId ? fetched.url : null;
}
