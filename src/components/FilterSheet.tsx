import { motion } from 'framer-motion';
import type { Filters, DietaryTag, Difficulty, MealType } from '../types';
import { CUISINE_LABELS } from '../data/recipes';
import { DEFAULT_FILTERS } from '../data/defaults';
import { CUISINES } from '../lib/cuisine';

interface FilterSheetProps {
  onClose: () => void;
  filters: Filters;
  setFilters: (fn: (prev: Filters) => Filters) => void;
}

export function FilterSheet({ onClose, filters, setFilters }: FilterSheetProps) {

  const toggle = (key: 'cookTime' | 'difficulty' | 'mealType', value: number | string) => {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  };
  const toggleArr = (key: 'dietary', value: DietaryTag) => {
    setFilters((f) => {
      const arr = f[key] ?? [];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const cookTimes = [
    { val: 15, label: 'Under 15 min', icon: '⚡' },
    { val: 30, label: 'Under 30 min', icon: '⏱️' },
    { val: 60, label: 'Under 1 hour', icon: '🕐' },
  ];
  const difficulties: Array<{ val: Difficulty; label: string }> = [
    { val: 'easy', label: 'Easy' },
    { val: 'medium', label: 'Medium' },
    { val: 'hard', label: 'Hard' },
  ];
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
  const diets: Array<{ val: DietaryTag; label: string; icon: string }> = [
    { val: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
    { val: 'vegan',      label: 'Vegan',       icon: '🌿' },
    { val: 'gluten-free', label: 'Gluten-free', icon: '🌾' },
  ];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="font-body text-[13px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="px-4 py-2.5 rounded-full font-body text-[14px] font-medium transition-all active:scale-95"
      style={{
        background: active ? 'var(--surface-dark)' : 'white',
        color: active ? 'white' : 'var(--text-secondary)',
        border: active ? '2px solid var(--surface-dark)' : '2px solid var(--border-default)',
      }}
    >
      {children}
    </button>
  );

  const mode = filters.ingredientMode ?? 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <motion.div
        className="absolute inset-0 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full bg-[var(--bg-page)] rounded-t-[32px] p-6 pb-8 max-h-[80vh] overflow-y-auto no-scrollbar"
        style={{ boxShadow: '0 -20px 40px rgba(0,0,0,0.15)' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="w-12 h-1.5 bg-[var(--border-default)] rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-[var(--text-primary)] text-3xl">Filters</h2>
          <button
            onClick={() => setFilters(() => DEFAULT_FILTERS)}
            className="font-body text-[14px] font-medium text-[var(--brand-500)] underline underline-offset-2"
          >
            Clear all
          </button>
        </div>

        <Section title="Pantry matching">
          <div className="w-full space-y-2">
            <div className="flex flex-wrap gap-2">
              {(['strict', 'flex1', 'flex2', 'flex3', 'all'] as const).map((m) => {
                const labels: Record<string, string> = {
                  strict: '✓ Only what I have',
                  flex1: '+ 1 staple',
                  flex2: '+ 2 staples',
                  flex3: '+ 3 staples',
                  all: '✨ Show everything',
                };
                return (
                  <Chip
                    key={m}
                    active={mode === m}
                    onClick={() => setFilters((f) => ({ ...f, ingredientMode: m }))}
                  >
                    {labels[m]}
                  </Chip>
                );
              })}
            </div>
            <p className="font-body text-[12px] text-[var(--text-tertiary)] leading-relaxed pt-1">
              {mode === 'strict' && "Only recipes you can make with exactly what's in your pantry — nothing extra needed."}
              {mode === 'flex1' && 'Recipes that need at most 1 common staple beyond your pantry.'}
              {mode === 'flex2' && 'Recipes that need up to 2 common staples beyond your pantry.'}
              {mode === 'flex3' && 'Recipes that need up to 3 common staples beyond your pantry.'}
              {mode === 'all' && 'Browse every recipe — best matches for your pantry come first.'}
            </p>
            {mode.startsWith('flex') && (
              <p className="font-body text-[11px] text-[var(--text-placeholder)] leading-relaxed pt-1 italic">
                Staples = salt, pepper, oil, butter, garlic, onion, common herbs &amp; spices.
              </p>
            )}
          </div>
        </Section>

        <Section title="Cook time">
          {cookTimes.map((c) => (
            <Chip key={c.val} active={filters.cookTime === c.val} onClick={() => toggle('cookTime', c.val)}>
              {c.icon} {c.label}
            </Chip>
          ))}
        </Section>

        <Section title="Difficulty">
          {difficulties.map((d) => (
            <Chip key={d.val} active={filters.difficulty === d.val} onClick={() => toggle('difficulty', d.val)}>
              {d.label}
            </Chip>
          ))}
        </Section>

        <Section title="Meal type">
          {meals.map((m) => (
            <Chip key={m} active={filters.mealType === m} onClick={() => toggle('mealType', m)}>
              {CUISINE_LABELS[m]}
            </Chip>
          ))}
        </Section>

        <Section title="Dietary preferences">
          {diets.map((d) => (
            <Chip
              key={d.val}
              active={(filters.dietary ?? []).includes(d.val)}
              onClick={() => toggleArr('dietary', d.val)}
            >
              {d.icon} {d.label}
            </Chip>
          ))}
        </Section>

        <div className="mb-6">
          <p className="font-body text-[13px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            Cuisine
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {CUISINES.map((c) => {
              const active = filters.cuisine === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilters((f) => ({ ...f, cuisine: f.cuisine === c.id ? null : c.id }))}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl font-body text-[13px] font-medium transition-all active:scale-95"
                  style={{
                    background: active ? 'var(--surface-dark)' : 'white',
                    color: active ? 'white' : 'var(--text-secondary)',
                    border: active ? '2px solid var(--surface-dark)' : '2px solid var(--border-default)',
                    minWidth: 72,
                  }}
                >
                  <span className="text-[22px] leading-none">{c.flag}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-4 rounded-2xl bg-[var(--surface-dark)] text-white font-body font-bold text-[16px] active:scale-[0.98] transition-transform"
        >
          Show recipes
        </button>
      </motion.div>
    </div>
  );
}
