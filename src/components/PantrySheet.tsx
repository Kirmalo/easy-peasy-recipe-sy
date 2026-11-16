import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/appStore';
import { useDialog } from '../hooks/useDialog';
import { daysUntil, expiryLabel } from '../lib/expiry';

interface PantrySheetProps {
  onClose: () => void;
  onGoToKitchen: () => void;
}

export function PantrySheet({ onClose, onGoToKitchen }: PantrySheetProps) {
  const dialogProps = useDialog(onClose, 'Your pantry');
  const { pantry, setPantry, pantryExpiry, setExpiry, removeFromPantry } = useAppStore(useShallow((s) => ({
    pantry: s.pantry, setPantry: s.setPantry, pantryExpiry: s.pantryExpiry, setExpiry: s.setExpiry, removeFromPantry: s.removeFromPantry,
  })));
  // Dated items first, soonest to expire at the top.
  const sorted = useMemo(() => [...pantry].sort((a, b) => {
    const da = pantryExpiry[a], db = pantryExpiry[b];
    if (da && db) return daysUntil(da) - daysUntil(db);
    return da ? -1 : db ? 1 : 0;
  }), [pantry, pantryExpiry]);
  const [input, setInput] = useState('');

  const add = (ing: string) => {
    const v = ing.trim().toLowerCase();
    if (!v) return;
    setPantry((p) => (p.includes(v) ? p : [...p, v]));
    setInput('');
  };

  const remove = (ing: string) => removeFromPantry([ing]);

  return (
    <div {...dialogProps} className="fixed inset-0 z-50 flex flex-col justify-end outline-none">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative max-w-[480px] w-full mx-auto bg-[var(--bg-page)] rounded-t-[32px] flex flex-col"
        style={{ maxHeight: '75vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-primary)] text-[22px] leading-tight">
              My Pantry
            </h2>
            <p className="font-body text-[var(--text-tertiary)] text-[13px] mt-0.5">
              {pantry.length} ingredient{pantry.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close pantry"
            className="w-9 h-9 rounded-full bg-[var(--surface-muted)] flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={16} strokeWidth={2.5} className="text-[var(--text-primary)]" />
          </button>
        </div>

        {/* Quick add */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add(input)}
              placeholder="Quick add an ingredient..."
              className="w-full px-4 py-3 pr-12 rounded-2xl font-body text-[15px] bg-white border-2 border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)]"
            />
            <button
              onClick={() => add(input)}
              aria-label="Add ingredient"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[var(--surface-dark)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus size={18} strokeWidth={2.8} className="text-white" />
            </button>
          </div>
        </div>

        {/* Pantry chips */}
        <div className="overflow-y-auto no-scrollbar px-6 pb-4 flex-1">
          {pantry.length === 0 ? (
            <p className="font-body text-[var(--text-tertiary)] text-[15px] text-center py-8">
              Nothing in your pantry yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-default)] bg-white rounded-2xl">
              {sorted.map((ing) => {
                const date = pantryExpiry[ing];
                const days = date ? daysUntil(date) : null;
                const urgent = days !== null && days <= 2;
                return (
                  <li key={ing} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[15px] font-medium text-[var(--text-primary)] capitalize truncate">{ing}</p>
                      {date && (
                        <p className="font-body text-[12px]" style={{ color: urgent ? 'var(--brand-600)' : 'var(--text-tertiary)' }}>
                          {expiryLabel(date)}
                        </p>
                      )}
                    </div>
                    <input
                      type="date"
                      value={date ?? ''}
                      onChange={(e) => setExpiry(ing, e.target.value || null)}
                      aria-label={`Use-by date for ${ing}`}
                      className="font-body text-[12px] text-[var(--text-secondary)] bg-[var(--surface-muted)] rounded-lg px-2 py-1.5 w-[8.5rem]"
                    />
                    <button
                      onClick={() => remove(ing)}
                      aria-label={`Remove ${ing}`}
                      className="w-8 h-8 rounded-full bg-[var(--surface-muted)] flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                    >
                      <X size={14} strokeWidth={2.8} className="text-[var(--text-secondary)]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-3 flex-shrink-0">
          <button
            onClick={() => { onClose(); onGoToKitchen(); }}
            className="w-full flex items-center justify-center gap-1.5 py-3 font-body text-[14px] font-semibold text-[var(--text-secondary)] border-2 border-[var(--border-default)] rounded-2xl active:scale-95 transition-transform bg-white"
          >
            Full kitchen setup
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
