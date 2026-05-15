import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Check, Mic, Square, AlertCircle, Sparkles, ChevronDown } from 'lucide-react';
import { COMMON_INGREDIENTS } from '../data/commonIngredients';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface KitchenViewProps {
  pantry: string[];
  setPantry: (fn: (prev: string[]) => string[]) => void;
  onContinue: () => void;
}

export function KitchenView({ pantry, setPantry, onContinue }: KitchenViewProps) {
  const [input, setInput] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const addIngredient = (ing: string) => {
    const v = ing.trim().toLowerCase();
    if (!v) return;
    setPantry((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setInput('');
  };

  const addMany = useCallback(
    (ings: string[]) => {
      if (!ings.length) return 0;
      let addedCount = 0;
      setPantry((prev) => {
        const next = [...prev];
        ings.forEach((ing) => {
          const v = ing.trim().toLowerCase();
          if (v && !next.includes(v)) { next.push(v); addedCount++; }
        });
        return next;
      });
      return addedCount;
    },
    [setPantry],
  );

  const remove = (ing: string) => setPantry((prev) => prev.filter((p) => p !== ing));

  const showError = (msg: string) => {
    setSpeechError(msg);
    setTimeout(() => setSpeechError(null), 4000);
  };

  const { isListening, transcript, speechSupported, startListening, stopListening } =
    useSpeechRecognition({
      onIngredients: (ings) => {
        const count = addMany(ings);
        if (count > 0) {
          setJustAdded(count);
          setTimeout(() => setJustAdded(null), 2500);
        } else if (ings.length === 0) {
          showError('Couldn\'t pick out ingredients. Try: "tomatoes, garlic, and pasta".');
        }
      },
      onError: showError,
    });

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32" style={{ animation: 'float-in 0.5s ease-out' }}>
      <div className="px-6 pt-4">
        <p className="font-body text-[var(--text-tertiary)] text-sm uppercase tracking-[0.18em] font-medium mb-2">
          Step one
        </p>
        <h1 className="font-display font-semibold text-[var(--text-primary)] text-[42px] leading-[1.02] tracking-tight mb-3">
          What's in your<br />
          <span className="italic font-medium" style={{ color: 'var(--brand-500)' }}>kitchen</span> today?
        </h1>
        <p className="font-body text-[var(--text-secondary)] text-[15px] mb-7 leading-relaxed">
          Type 'em, tap 'em, or just tell us out loud. We'll find recipes you can actually make.
        </p>

        {/* Text input */}
        <div className="relative mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addIngredient(input)}
            placeholder="e.g. tomatoes, garlic, pasta..."
            className="w-full px-5 py-4 pr-14 rounded-2xl font-body text-[16px] bg-white border-2 border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none placeholder:text-[var(--text-placeholder)] text-[var(--text-primary)]"
            style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.10)' }}
          />
          <button
            onClick={() => addIngredient(input)}
            aria-label="Add ingredient"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--surface-dark)] text-white active:scale-90 transition-transform"
          >
            <Plus size={22} strokeWidth={2.8} />
          </button>
        </div>

        {/* Voice input */}
        {speechSupported && (
          <div className="mb-5">
            {!isListening ? (
              <button
                onClick={startListening}
                className="w-full py-3.5 rounded-2xl bg-white border-2 border-[var(--border-default)] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
                style={{ boxShadow: '0 4px 12px -4px rgba(var(--ink-warm-rgb),0.12)' }}
              >
                <span className="w-9 h-9 rounded-full bg-[var(--brand-500)] flex items-center justify-center">
                  <Mic size={17} strokeWidth={2.6} className="text-white" />
                </span>
                <span className="font-body font-semibold text-[15px] text-[var(--text-primary)]">Tap to talk</span>
                <span className="font-body text-[13px] text-[var(--text-tertiary)]">· say your ingredients</span>
              </button>
            ) : (
              <div
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-400) 100%)',
                  animation: 'pop 0.3s ease-out',
                  boxShadow: '0 12px 28px -8px rgba(var(--brand-rgb),0.5)',
                }}
              >
                <div className="absolute inset-0 grain opacity-20 pointer-events-none" />
                <div className="flex items-center gap-4 mb-3 relative">
                  <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-white/40" style={{ animation: 'ripple 1.6s ease-out infinite' }} />
                    <span className="absolute inset-0 rounded-full bg-white/30" style={{ animation: 'ripple 1.6s ease-out 0.4s infinite' }} />
                    <span
                      className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center"
                      style={{ animation: 'mic-pulse 1.1s ease-in-out infinite' }}
                    >
                      <Mic size={20} strokeWidth={2.8} className="text-[var(--brand-500)]" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-bold text-white text-[15px] leading-tight">Listening…</p>
                    <p className="font-body text-white/85 text-[12px] leading-tight mt-0.5">Speak naturally, then tap stop</p>
                  </div>
                  <div className="flex items-end gap-1 h-7">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-white"
                        style={{ animation: `wave 0.${6 + i}s ease-in-out infinite`, animationDelay: `${i * 0.12}s` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2.5 mb-3 min-h-[44px] flex items-center">
                  <p className="font-body text-white text-[14px] leading-snug">
                    {transcript || (
                      <span className="text-white/65 italic">e.g. "I have tomatoes, garlic, and some pasta"</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={stopListening}
                  className="w-full py-3 rounded-xl bg-white text-[var(--brand-500)] font-body font-bold text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <Square size={14} strokeWidth={3} fill="var(--brand-500)" />
                  Done
                </button>
              </div>
            )}

            {speechError && (
              <div
                className="mt-3 px-4 py-3 rounded-xl bg-[var(--brand-50)] border-2 border-[var(--brand-200)] flex items-start gap-2.5"
                style={{ animation: 'float-in 0.3s ease-out' }}
                role="alert"
              >
                <AlertCircle size={16} strokeWidth={2.5} className="text-[var(--brand-500)] flex-shrink-0 mt-0.5" />
                <p className="font-body text-[13px] text-[var(--brand-800)] leading-snug">{speechError}</p>
              </div>
            )}

            {justAdded !== null && (
              <div
                className="mt-3 px-4 py-3 rounded-xl bg-[var(--success-100)] border-2 border-[var(--success-300)] flex items-center gap-2.5"
                style={{ animation: 'float-in 0.3s ease-out' }}
              >
                <span className="w-6 h-6 rounded-full bg-[var(--success-500)] flex items-center justify-center flex-shrink-0">
                  <Check size={14} strokeWidth={3} className="text-white" />
                </span>
                <p className="font-body text-[13px] font-semibold text-[var(--success-700)]">
                  Added {justAdded} ingredient{justAdded === 1 ? '' : 's'} from your voice!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pantry chips */}
        {pantry.length > 0 && (
          <div className="mb-7 relative" style={{ animation: 'float-in 0.4s ease-out' }}>
            <div
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, var(--brand-50) 0%, var(--accent-100) 100%)',
                boxShadow: '0 4px 20px -8px rgba(var(--brand-rgb),0.2)',
              }}
            >
              <div className="absolute inset-0 grain opacity-10 pointer-events-none" />
              <div className="flex items-center justify-between mb-3 relative">
                <p className="font-body text-[13px] font-bold text-[var(--brand-800)] uppercase tracking-wider">
                  In your pantry
                </p>
                <span className="font-display font-bold text-[var(--brand-500)] text-[18px] leading-none">
                  {pantry.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 relative">
                {pantry.map((ing) => (
                  <button
                    key={ing}
                    onClick={() => remove(ing)}
                    className="group inline-flex items-center gap-1.5 pl-4 pr-2 py-2 rounded-full font-body text-[14px] font-medium text-white active:scale-95 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-400) 100%)',
                      animation: 'pop 0.25s ease-out',
                      boxShadow: '0 4px 10px -2px rgba(var(--brand-rgb),0.4)',
                    }}
                  >
                    {ing}
                    <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                      <X size={12} strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick add categories */}
        <div className="space-y-2">
          {Object.entries(COMMON_INGREDIENTS).map(([cat, items]) => {
            const isOpen = openCategories.has(cat);
            const activeCount = items.filter((it) => pantry.includes(it)).length;
            return (
              <div
                key={cat}
                className="rounded-2xl overflow-hidden bg-white border-2"
                style={{ borderColor: isOpen ? 'var(--border-strong)' : 'var(--border-default)' }}
              >
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:bg-[var(--surface-muted)]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-body text-[14px] font-semibold text-[var(--text-primary)]">
                      {cat}
                    </span>
                    {activeCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--brand-500)] text-white font-body text-[11px] font-bold leading-none">
                        {activeCount}
                      </span>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <ChevronDown size={18} strokeWidth={2.5} className="text-[var(--text-tertiary)]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
                        {items.map((it) => {
                          const active = pantry.includes(it);
                          return (
                            <button
                              key={it}
                              onClick={() => active ? remove(it) : addIngredient(it)}
                              className="px-3.5 py-2 rounded-full font-body text-[14px] font-medium transition-all active:scale-95"
                              style={{
                                background: active ? 'var(--surface-dark)' : 'var(--surface-muted)',
                                color: active ? 'white' : 'var(--text-secondary)',
                                border: active ? '2px solid var(--surface-dark)' : '2px solid transparent',
                              }}
                            >
                              {active && <Check size={13} strokeWidth={3} className="inline mr-1 -mt-0.5" />}
                              {it}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <button
          onClick={onContinue}
          className="mt-8 w-full py-3 font-body text-[14px] font-medium text-[var(--text-tertiary)] underline underline-offset-4"
        >
          Or skip and browse all recipes →
        </button>
      </div>

      {/* Floating CTA */}
      {pantry.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center px-6 z-30 pointer-events-none">
          <button
            onClick={onContinue}
            className="pointer-events-auto px-7 py-4 rounded-full bg-[var(--brand-500)] text-white font-body font-bold text-[16px] shadow-2xl active:scale-95 transition-transform flex items-center gap-2"
            style={{ boxShadow: '0 20px 40px -10px rgba(var(--brand-rgb), 0.5)', animation: 'pop 0.4s ease-out' }}
          >
            Find recipes
            <Sparkles size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
