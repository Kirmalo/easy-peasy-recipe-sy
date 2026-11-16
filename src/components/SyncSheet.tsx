import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, RefreshCw, Smartphone } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/appStore';
import { useDialog } from '../hooks/useDialog';
import { createSync, linkSync, disableSync, pull, push, fetchSnapshot } from '../lib/syncClient';
import { normalizeSyncCode } from '../lib/syncCode';

interface SyncSheetProps {
  onClose: () => void;
  /** Code from a scanned QR link, to prefill "I have a code". */
  initialCode?: string | null;
}

const syncLink = (code: string) => `${window.location.origin}/?sync=${code}`;

export function SyncSheet({ onClose, initialCode }: SyncSheetProps) {
  const dialogProps = useDialog(onClose, 'Sync across devices');
  const { syncCode, syncStatus, lastSyncedAt } = useAppStore(
    useShallow((s) => ({ syncCode: s.syncCode, syncStatus: s.syncStatus, lastSyncedAt: s.lastSyncedAt })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState(initialCode ?? '');
  const [pendingLink, setPendingLink] = useState<{ code: string; items: number } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!syncCode) return;
    let cancelled = false;
    import('qrcode')
      .then((QR) => QR.toDataURL(syncLink(syncCode), { margin: 1, width: 360 }))
      .then((url) => { if (!cancelled) setQr(url); })
      .catch(() => { /* QR is a convenience — the code still works */ });
    return () => { cancelled = true; };
  }, [syncCode]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };

  const checkCode = () => run(async () => {
    const code = normalizeSyncCode(entry);
    if (!code) throw new Error('That code should be 12 letters and numbers, like ABCD-EFGH-JKMN.');
    const snap = await fetchSnapshot(code);
    setPendingLink({ code, items: snap.data.cookbook.length + snap.data.pantry.length });
  });

  return (
    <div {...dialogProps} className="fixed inset-0 z-50 flex flex-col justify-end outline-none">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative max-w-[480px] w-full mx-auto bg-[var(--bg-page)] rounded-t-[32px] flex flex-col overflow-y-auto no-scrollbar"
        style={{ maxHeight: '85vh' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-[24px] flex items-center gap-2">
            <Smartphone size={20} strokeWidth={2.4} aria-hidden="true" /> Sync across devices
          </h2>
          <button onClick={onClose} aria-label="Close sync" className="w-9 h-9 rounded-full bg-[var(--surface-muted)] flex items-center justify-center active:scale-90 transition-transform">
            <X size={16} strokeWidth={2.5} className="text-[var(--text-primary)]" />
          </button>
        </div>

        <div className="px-6 pb-8 font-body text-[var(--text-primary)]">
          {syncCode ? (
            <>
              <p className="text-[14px] text-[var(--text-secondary)] mb-4">
                This device syncs your pantry, cookbook, plan, ratings and notes. Enter the code (or scan the QR) on another device.
              </p>
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 mb-4">
                {qr && <img src={qr} alt={`QR code for sync code ${syncCode}`} className="w-44 h-44" />}
                <p className="font-mono text-[22px] font-bold tracking-[0.12em]" aria-label={`Sync code ${syncCode.split('').join(' ')}`}>{syncCode}</p>
                <button
                  onClick={() => { void navigator.clipboard?.writeText(syncCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--surface-cream)] active:scale-95 transition-transform"
                >
                  {copied ? <Check size={13} strokeWidth={2.8} aria-hidden="true" /> : <Copy size={13} strokeWidth={2.5} aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mb-1" role="status">
                {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? "Couldn't reach sync — will retry when you're back online."
                  : lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Sync is on'}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mb-5">
                Anyone with this code can see and change your synced data — keep it private.
              </p>
              <div className="flex flex-col gap-2">
                <button disabled={busy} onClick={() => run(async () => { await push(); await pull(); })}
                  className="w-full py-3 rounded-2xl bg-[var(--surface-dark)] text-white text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
                  <RefreshCw size={15} strokeWidth={2.6} aria-hidden="true" /> Sync now
                </button>
                <button disabled={busy} onClick={() => run(() => disableSync(false))}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-[var(--border-default)] text-[14px] font-semibold text-[var(--text-secondary)] active:scale-95 transition-transform">
                  Stop syncing this device
                </button>
                <button disabled={busy} onClick={() => { if (window.confirm('Delete the synced copy for every device? Data on each device stays.')) void run(() => disableSync(true)); }}
                  className="w-full py-2 text-[13px] font-semibold text-[var(--brand-600)] underline underline-offset-2">
                  Delete synced data
                </button>
              </div>
            </>
          ) : pendingLink ? (
            <>
              <p className="text-[15px] mb-2 font-semibold">Use the synced data on this device?</p>
              <p className="text-[14px] text-[var(--text-secondary)] mb-5">
                This replaces what's on this device ({pendingLink.items} saved recipes and pantry items found in the sync).
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPendingLink(null)} className="flex-1 py-3 rounded-2xl bg-white border-2 border-[var(--border-default)] text-[14px] font-semibold">Cancel</button>
                <button disabled={busy} onClick={() => run(() => linkSync(pendingLink.code))}
                  className="flex-1 py-3 rounded-2xl bg-[var(--brand-500)] text-white text-[14px] font-semibold disabled:opacity-50">Replace &amp; sync</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] text-[var(--text-secondary)] mb-4">
                No account needed: turn on sync to get a private code, then enter it on your other devices.
              </p>
              <button disabled={busy} onClick={() => run(async () => { await createSync(); })}
                className="w-full py-3.5 rounded-2xl bg-[var(--brand-500)] text-white text-[15px] font-semibold active:scale-95 transition-transform disabled:opacity-50 mb-6">
                {busy ? 'Working…' : 'Turn on sync'}
              </button>
              <label htmlFor="sync-code" className="block text-[13px] font-semibold text-[var(--text-secondary)] mb-2">I already have a code</label>
              <div className="flex gap-2">
                <input id="sync-code" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="ABCD-EFGH-JKMN" autoCapitalize="characters" autoComplete="off"
                  className="flex-1 min-w-0 px-4 py-3 rounded-2xl font-mono text-[15px] bg-white border-2 border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none uppercase" />
                <button disabled={busy || !entry.trim()} onClick={checkCode}
                  className="px-5 rounded-2xl bg-[var(--surface-dark)] text-white text-[14px] font-semibold disabled:opacity-40">Link</button>
              </div>
            </>
          )}
          {error && <p role="alert" className="text-[13px] text-red-600 mt-3">{error}</p>}
        </div>
      </motion.div>
    </div>
  );
}
