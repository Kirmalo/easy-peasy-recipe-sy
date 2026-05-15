import { useState, useEffect } from 'react';
import { fetchRecipeImage, imageCache } from '../lib/api';

export function useRecipeImage(recipeId: number): string | null {
  const [url, setUrl] = useState<string | null>(
    () => imageCache.get(recipeId) ?? null,
  );

  useEffect(() => {
    if (imageCache.has(recipeId)) {
      setUrl(imageCache.get(recipeId) ?? null);
      return;
    }
    let cancelled = false;
    fetchRecipeImage(recipeId).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [recipeId]);

  return url;
}
