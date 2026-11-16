import { useEffect } from 'react';
import { useAppStore, pickPersisted } from '../store/appStore';
import { pull, push, isApplyingRemote } from '../lib/syncClient';

/** Background sync while a sync code is set: pull on open / return to the tab, push after changes. */
export function useDeviceSync(): void {
  const syncCode = useAppStore((s) => s.syncCode);

  useEffect(() => {
    if (!syncCode) return;
    void pull();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (isApplyingRemote()) return;
      if (JSON.stringify(pickPersisted(state)) === JSON.stringify(pickPersisted(prev))) return; // session-only change
      clearTimeout(timer);
      timer = setTimeout(() => { void push(); }, 1500);
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull();
      else { clearTimeout(timer); void push(); } // flush before the tab goes to the background
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsubscribe();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [syncCode]);
}
