import { useState, useCallback } from 'react';

export function useStorage<T>(
  key: string,
  defaultValue: T,
): [T, (newVal: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const update = useCallback(
    (newVal: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof newVal === 'function' ? (newVal as (p: T) => T)(prev) : newVal;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {
          // quota exceeded — continue with in-memory state
        }
        return v;
      });
    },
    [key],
  );

  return [value, update];
}
