import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, ChevronRight } from 'lucide-react';

interface PantrySheetProps {
  pantry: string[];
  setPantry: (fn: (prev: string[]) => string[]) => void;
  onClose: () => void;
  onGoToKitchen: () => void;
}

export function PantrySheet({ pantry, setPantry, onClose, onGoToKitchen }: PantrySheetProps) {
  const [input, setInput] = useState('');

  const add = (ing: string) => {
    const v = ing.trim().toLowerCase();
    if (!v) return;
    setPantry((p) => (p.includes(v) ? p : [...p, v]));
    setInput('');
  };

  const remove = (ing: string) => setPantry((p) => p.filter((x) => x !== ing));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
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
            <div className="flex flex-wrap gap-2">
              {pantry.map((ing) => (
                <button
                  key={ing}
                  onClick={() => remove(ing)}
                  className="inline-flex items-center gap-1.5 pl-4 pr-2 py-2 rounded-full font-body text-[14px] font-medium text-white active:scale-95 transition-transform capitalize"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-400) 100%)',
                    boxShadow: '0 4px 10px -2px rgba(var(--brand-rgb),0.35)',
                  }}
                >
                  {ing}
                  <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                    <X size={12} strokeWidth={3} />
                  </span>
                </button>
              ))}
            </div>
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
