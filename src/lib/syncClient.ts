import { useAppStore, pickPersisted } from '../store/appStore';
import { mergePersisted, sanitizePersisted, type PersistedState } from '../store/persisted';

const META_KEY = 'recipesy-sync-meta';

/** Server timestamp of the snapshot this device last pulled or pushed. */
function readBase(): number {
  try { return Number(JSON.parse(localStorage.getItem(META_KEY) ?? '{}').updatedAt) || 0; } catch { return 0; }
}
function writeBase(updatedAt: number) {
  try { localStorage.setItem(META_KEY, JSON.stringify({ updatedAt })); } catch { /* ignore */ }
}

const withoutCode = (s: PersistedState) => ({ ...s, syncCode: null });
let applyingRemote = false;
let lastPushed = '';

/** Replace local data with a remote snapshot, keeping this device's sync code. */
function applyRemote(data: PersistedState, updatedAt: number, code: string) {
  applyingRemote = true;
  try {
    useAppStore.getState().importState({ ...data, syncCode: code });
  } finally {
    applyingRemote = false;
  }
  writeBase(updatedAt);
  lastPushed = JSON.stringify(withoutCode(pickPersisted(useAppStore.getState())));
}

export const isApplyingRemote = () => applyingRemote;

export async function createSync(): Promise<string> {
  const data = withoutCode(pickPersisted(useAppStore.getState()));
  const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
  const body = await res.json().catch(() => ({})) as { code?: string; updatedAt?: number; error?: string };
  if (!res.ok || !body.code) throw new Error(body.error ?? 'Could not turn on sync');
  writeBase(body.updatedAt ?? Date.now());
  lastPushed = JSON.stringify(data);
  useAppStore.getState().setSyncCode(body.code);
  useAppStore.getState().setSyncStatus('idle', Date.now());
  return body.code;
}

/** Fetch a snapshot without applying it (to confirm before replacing local data). */
export async function fetchSnapshot(code: string): Promise<{ data: PersistedState; updatedAt: number }> {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
  const body = await res.json().catch(() => ({})) as { data?: unknown; updatedAt?: number; error?: string };
  if (!res.ok) throw new Error(body.error ?? 'Could not reach sync');
  return { data: sanitizePersisted(body.data), updatedAt: Number(body.updatedAt) || 0 };
}

export async function linkSync(code: string): Promise<void> {
  const snap = await fetchSnapshot(code);
  applyRemote(snap.data, snap.updatedAt, code);
  useAppStore.getState().setSyncStatus('idle', Date.now());
}

export async function pull(): Promise<void> {
  const { syncCode, setSyncStatus } = useAppStore.getState();
  if (!syncCode) return;
  try {
    setSyncStatus('syncing');
    const snap = await fetchSnapshot(syncCode);
    if (snap.updatedAt > readBase()) applyRemote(snap.data, snap.updatedAt, syncCode);
    setSyncStatus('idle', Date.now());
  } catch {
    setSyncStatus('error');
  }
}

export async function push(): Promise<void> {
  const state = useAppStore.getState();
  const code = state.syncCode;
  if (!code) return;
  const data = withoutCode(pickPersisted(state));
  const serialized = JSON.stringify(data);
  if (serialized === lastPushed) return;
  try {
    state.setSyncStatus('syncing');
    const res = await fetch('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, data, updatedAt: readBase() }),
    });
    const body = await res.json().catch(() => ({})) as { updatedAt?: number; data?: unknown };
    if (res.status === 409 && body.data) {
      // Another device synced first: merge both, then push the result.
      const merged = mergePersisted(sanitizePersisted(body.data), data);
      applyRemote(merged, Number(body.updatedAt) || 0, code);
      lastPushed = '';
      return push();
    }
    if (!res.ok) throw new Error();
    writeBase(Number(body.updatedAt) || Date.now());
    lastPushed = serialized;
    useAppStore.getState().setSyncStatus('idle', Date.now());
  } catch {
    useAppStore.getState().setSyncStatus('error');
  }
}

export async function disableSync(deleteRemote: boolean): Promise<void> {
  const code = useAppStore.getState().syncCode;
  if (deleteRemote && code) {
    await fetch(`/api/sync?code=${encodeURIComponent(code)}`, { method: 'DELETE' }).catch(() => undefined);
  }
  writeBase(0);
  lastPushed = '';
  useAppStore.getState().setSyncCode(null);
}
