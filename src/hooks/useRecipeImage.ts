import { useState, useEffect } from 'react';
import { fetchRecipeImage, imageCache } from '../lib/api';

export function useRecipeImage(recipeId: number, searchName?: string): string | null {
  const [url, setUrl] = useState<string | null>(
    () => imageCache.get(recipeId) ?? null,
  );

  useEffect(() => {
    if (imageCache.has(recipeId)) {
      setUrl(imageCache.get(recipeId) ?? null);
      return;
    }
    let cancelled = false;
    fetchRecipeImage(recipeId, searchName).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [recipeId, searchName]);

  return url;
}
