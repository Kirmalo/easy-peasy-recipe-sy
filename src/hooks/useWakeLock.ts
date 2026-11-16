import { useEffect } from 'react';

/** Keeps the screen on while `active` (e.g. in cooking mode). No-op where unsupported. */
export function useWakeLock(active = true): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) { void s.release(); return; }
        sentinel = s;
        s.addEventListener('release', () => { if (sentinel === s) sentinel = null; });
      } catch { /* denied, low battery, etc. */ }
    };

    // The browser drops the lock when the tab is hidden; take it back on return.
    const onVisibility = () => { void acquire(); };
    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release();
      sentinel = null;
    };
  }, [active]);
}
