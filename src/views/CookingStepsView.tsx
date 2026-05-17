import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { THEMES } from '../data/themes';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { scaleAmount } from '../lib/scaleAmount';
import type { Recipe } from '../types';

interface CookingStepsViewProps {
  recipeId: number;
  onClose: () => void;
  onDone: () => void;
  onRate?: (stars: 1 | 2 | 3) => void;
  extraRecipes?: Recipe[];
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

export function CookingStepsView({ recipeId, onClose, onDone, onRate, extraRecipes }: CookingStepsViewProps) {
  const recipe = [...(extraRecipes ?? []), ...RECIPES].find((r) => r.id === recipeId)!;
  const theme = THEMES[recipe.theme] ?? THEMES.tomato;
  const imageUrl = useRecipeImage(recipeId);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 0 = intro, 1..N = steps, N+1 = done
  const totalSteps = recipe.steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [showIngredients, setShowIngredients] = useState(false);
  const [servings, setServings] = useState(recipe.servings);
  const scaleFactor = servings / recipe.servings;

  const isIntro = stepIndex === 0;
  const isDone = stepIndex === totalSteps + 1;

  const goNext = () => {
    setDir(1);
    setShowIngredients(false);
    setStepIndex((i) => Math.min(i + 1, totalSteps + 1));
  };

  const goPrev = () => {
    setDir(-1);
    setShowIngredients(false);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const showFallback = !imageUrl || imgError || !imgLoaded;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--surface-dark)' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-[480px] mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={20} className="text-white" strokeWidth={2.5} />
          </button>
          <div className="text-center">
            {isIntro && (
              <p className="font-body text-white/60 text-[13px] font-semibold truncate max-w-[200px]">
                {recipe.name}
              </p>
            )}
            {!isIntro && !isDone && (
              <p className="font-body text-white/60 text-[13px] font-semibold">
                Step {stepIndex} of {totalSteps}
              </p>
            )}
          </div>
          <div className="w-11" />
        </div>

        {/* Card area */}
        <div className="flex-1 flex flex-col justify-center px-6 overflow-hidden">
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: '3 / 4.2', maxHeight: '60vh' }}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={stepIndex}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0 rounded-[28px] overflow-hidden"
                style={{ background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)` }}
              >
                {/* Shared background layer */}
                {!isDone && (
                  <>
                    {showFallback && (
                      <>
                        <div className="absolute inset-0 grain opacity-30" />
                        <div
                          className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.12)' }}
                        />
                        <div
                          className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full"
                          style={{ background: 'rgba(0,0,0,0.10)' }}
                        />
                        {isIntro && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="text-[140px] leading-none"
                              style={{ filter: 'drop-shadow(0 12px 25px rgba(0,0,0,0.25))' }}
                            >
                              {recipe.emoji}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {imageUrl && !imgError && (
                      <img
                        src={imageUrl}
                        alt={recipe.name}
                        draggable={false}
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ userSelect: 'none', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.7s' }}
                      />
                    )}

                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: isIntro
                          ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.6) 68%, rgba(0,0,0,0.9) 100%)'
                          : 'rgba(0,0,0,0.62)',
                      }}
                    />
                  </>
                )}

                {/* Done card decorations */}
                {isDone && (
                  <>
                    <div className="absolute inset-0 grain opacity-20" />
                    <div
                      className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    />
                  </>
                )}

                {/* Intro content — flex column prevents ingredient list from overlapping CTA */}
                {isIntro && (
                  <div className="absolute inset-0 flex flex-col px-6 pt-6 pb-9">
                    {/* Ingredient list — shrinks and scrolls if recipe has many items */}
                    <div
                      className="rounded-2xl overflow-y-auto no-scrollbar"
                      style={{
                        background: 'rgba(0,0,0,0.32)',
                        backdropFilter: 'blur(12px)',
                        flexShrink: 1,
                        minHeight: 0,
                      }}
                    >
                      <div className="px-4 py-3.5">
                        <p className="font-body text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">
                          You'll need
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                          {recipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-baseline gap-2 min-w-0">
                              <span className="font-body text-white/60 text-[13px] flex-shrink-0 tabular-nums">
                                {scaleAmount(recipe.amounts[i], scaleFactor)}
                              </span>
                              <span className="font-body text-white/95 text-[14px] font-medium leading-snug capitalize">
                                {ing}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Elastic gap — fills available space, collapses when ingredients are many */}
                    <div style={{ flex: '1 0 10px' }} />

                    {/* CTA — never shrinks */}
                    <div className="flex-shrink-0">
                      <p className="font-body text-white/60 text-[11px] uppercase tracking-widest font-semibold mb-2">
                        Ready to cook?
                      </p>
                      <h2 className="font-display font-semibold text-white text-[28px] leading-[1.05] tracking-tight mb-2">
                        Let's make <span className="italic font-medium">{recipe.name}!</span>
                      </h2>
                      <p className="font-body text-white/65 text-[13px] mb-3">
                        {totalSteps} steps · {recipe.cookTime} min
                      </p>
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setServings((s) => Math.max(1, s - 1))}
                          disabled={servings <= 1}
                          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          <Minus size={14} strokeWidth={3} className="text-white" />
                        </button>
                        <span className="font-body text-white font-semibold text-[15px] tabular-nums min-w-[90px] text-center">
                          {servings} {servings === 1 ? 'serving' : 'servings'}
                        </span>
                        <button
                          onClick={() => setServings((s) => s + 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          <Plus size={14} strokeWidth={3} className="text-white" />
                        </button>
                      </div>
                      <button
                        onClick={goNext}
                        className="w-full py-3.5 rounded-2xl bg-white font-body font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        style={{ color: 'var(--surface-dark)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.35)' }}
                      >
                        Start cooking
                        <ChevronRight size={20} strokeWidth={2.8} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step content */}
                {!isIntro && !isDone && (
                  <>
                    {/* Badge row */}
                    <div className="absolute top-7 left-7 right-7 flex items-center justify-between">
                      <div
                        className="px-4 py-2 rounded-full font-body font-bold text-[11px] uppercase tracking-widest text-white"
                        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                      >
                        Step {stepIndex}
                      </div>
                      <button
                        onClick={() => setShowIngredients(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full font-body font-semibold text-[11px] text-white active:scale-95 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                      >
                        🧂 Ingredients
                      </button>
                    </div>

                    {/* Step text — fills space below badge row */}
                    <div
                      className="absolute left-0 right-0 bottom-0 overflow-y-auto no-scrollbar flex items-end"
                      style={{ top: 76, padding: '12px 28px 36px' }}
                    >
                      <p
                        className="font-display font-semibold text-white leading-[1.35] tracking-tight"
                        style={{
                          fontSize: (() => {
                            const len = recipe.steps[stepIndex - 1].length;
                            if (len > 180) return 15;
                            if (len > 120) return 18;
                            if (len > 75) return 22;
                            return 28;
                          })(),
                        }}
                      >
                        {recipe.steps[stepIndex - 1]}
                      </p>
                    </div>

                    {/* Ingredient sheet — slides up inside card on demand */}
                    <AnimatePresence>
                      {showIngredients && (
                        <motion.div
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute inset-0 rounded-[28px] flex flex-col"
                          style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(20px)' }}
                          onClick={() => setShowIngredients(false)}
                        >
                          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                            <p className="font-body text-[11px] uppercase tracking-widest text-white/50 font-semibold">
                              Ingredients
                            </p>
                            <button
                              onClick={() => setShowIngredients(false)}
                              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <X size={14} strokeWidth={2.5} className="text-white" />
                            </button>
                          </div>
                          <div
                            className="flex-1 overflow-y-auto no-scrollbar px-6 pb-2 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {recipe.ingredients.map((ing, i) => (
                              <div key={i} className="flex items-baseline gap-3">
                                <span className="font-body text-white/50 text-[13px] tabular-nums w-16 flex-shrink-0 text-right">
                                  {scaleAmount(recipe.amounts[i], scaleFactor)}
                                </span>
                                <span className="font-body text-white text-[15px] font-medium capitalize leading-snug">
                                  {ing}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="font-body text-white/25 text-[11px] text-center py-5 flex-shrink-0">
                            tap anywhere to close
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Done content */}
                {isDone && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div
                      className="text-[90px] leading-none mb-4"
                      style={{ animation: 'pop 0.5s ease-out' }}
                    >
                      🎉
                    </div>
                    <h2 className="font-display font-semibold text-white text-[38px] leading-tight tracking-tight mb-2">
                      You made it!
                    </h2>
                    <p className="font-body text-white/70 text-[15px] mb-5">
                      How was {recipe.name}?
                    </p>
                    <div className="flex gap-4 mb-7">
                      {([1, 2, 3] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { onRate?.(s); onDone(); }}
                          className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                        >
                          <span className="text-[52px] leading-none" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                            {s === 1 ? '😐' : s === 2 ? '😊' : '🤩'}
                          </span>
                          <span className="font-body text-white/60 text-[11px] font-semibold">
                            {s === 1 ? 'OK' : s === 2 ? 'Good' : 'Amazing'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={onDone}
                      className="font-body text-white/40 text-[13px] underline underline-offset-2 active:text-white/70"
                    >
                      Skip rating
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          {!isIntro && !isDone && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {recipe.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDir(i + 1 > stepIndex ? 1 : -1);
                    setShowIngredients(false);
                    setStepIndex(i + 1);
                  }}
                  style={{
                    width: i + 1 === stepIndex ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i + 1 === stepIndex ? 'white' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {!isIntro && !isDone && (
          <div className="flex items-center justify-between px-6 pb-10 pt-5 flex-shrink-0">
            <button
              onClick={goPrev}
              disabled={stepIndex === 1}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-25 disabled:pointer-events-none"
            >
              <ChevronLeft size={24} className="text-white" strokeWidth={2.5} />
            </button>

            <p className="font-body text-white/35 text-[12px] uppercase tracking-wider">
              tap dots to jump
            </p>

            <button
              onClick={goNext}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform"
              style={{ boxShadow: '0 8px 20px -4px rgba(0,0,0,0.4)', color: 'var(--surface-dark)' }}
            >
              <ChevronRight size={24} strokeWidth={2.8} />
            </button>
          </div>
        )}

        {(isIntro || isDone) && <div className="pb-10 flex-shrink-0" />}
      </div>
    </motion.div>
  );
}
