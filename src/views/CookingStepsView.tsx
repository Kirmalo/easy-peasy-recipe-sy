import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { RECIPES } from '../data/recipes';
import { THEMES } from '../data/themes';
import { useRecipeImage } from '../hooks/useRecipeImage';

interface CookingStepsViewProps {
  recipeId: number;
  onClose: () => void;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

export function CookingStepsView({ recipeId, onClose }: CookingStepsViewProps) {
  const recipe = RECIPES.find((r) => r.id === recipeId)!;
  const theme = THEMES[recipe.theme] ?? THEMES.tomato;
  const imageUrl = useRecipeImage(recipeId);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 0 = intro, 1..N = steps, N+1 = done
  const totalSteps = recipe.steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);

  const isIntro = stepIndex === 0;
  const isDone = stepIndex === totalSteps + 1;

  const goNext = () => {
    setDir(1);
    setStepIndex((i) => Math.min(i + 1, totalSteps + 1));
  };

  const goPrev = () => {
    setDir(-1);
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

                {/* Intro content */}
                {isIntro && (
                  <>
                    {/* Ingredient list — upper area */}
                    <div className="absolute top-6 left-6 right-6">
                      <div
                        className="rounded-2xl px-4 py-3"
                        style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(12px)' }}
                      >
                        <p className="font-body text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2.5">
                          You'll need
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          {recipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-baseline gap-1.5 min-w-0">
                              <span className="font-body text-white/55 text-[11px] flex-shrink-0 tabular-nums">
                                {recipe.amounts[i]}
                              </span>
                              <span className="font-body text-white/90 text-[12px] font-medium truncate capitalize">
                                {ing}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* CTA — bottom area */}
                    <div className="absolute bottom-0 left-0 right-0 p-7 pb-9">
                      <p className="font-body text-white/60 text-[11px] uppercase tracking-widest font-semibold mb-2">
                        Ready to cook?
                      </p>
                      <h2 className="font-display font-semibold text-white text-[32px] leading-[1.05] tracking-tight mb-3">
                        Let's make<br />
                        <span className="italic font-medium">{recipe.name}!</span>
                      </h2>
                      <p className="font-body text-white/65 text-[14px] mb-6">
                        {totalSteps} steps · {recipe.cookTime} min · serves {recipe.servings}
                      </p>
                      <button
                        onClick={goNext}
                        className="w-full py-4 rounded-2xl bg-white font-body font-bold text-[16px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        style={{ color: 'var(--surface-dark)', boxShadow: '0 8px 24px -4px rgba(0,0,0,0.35)' }}
                      >
                        Start cooking
                        <ChevronRight size={20} strokeWidth={2.8} />
                      </button>
                    </div>
                  </>
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
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px]"
                        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                      >
                        {recipe.emoji}
                      </div>
                    </div>

                    {/* Ingredient reference strip — scrollable */}
                    <div
                      className="absolute left-5 right-5 overflow-x-auto no-scrollbar"
                      style={{ top: 76 }}
                    >
                      <div className="flex gap-1.5 pb-0.5">
                        {recipe.ingredients.map((ing, i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 rounded-full px-3 py-1.5 flex items-center gap-1.5"
                            style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(8px)' }}
                          >
                            <span className="font-body text-white/55 text-[10px] whitespace-nowrap tabular-nums">
                              {recipe.amounts[i]}
                            </span>
                            <span className="font-body text-white/90 text-[11px] font-medium whitespace-nowrap capitalize">
                              {ing}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step text */}
                    <div className="absolute bottom-0 left-0 right-0 p-7 pb-9">
                      <p className="font-display font-semibold text-white text-[26px] leading-[1.35] tracking-tight">
                        {recipe.steps[stepIndex - 1]}
                      </p>
                    </div>
                  </>
                )}

                {/* Done content */}
                {isDone && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div
                      className="text-[90px] leading-none mb-5"
                      style={{ animation: 'pop 0.5s ease-out' }}
                    >
                      🎉
                    </div>
                    <h2 className="font-display font-semibold text-white text-[38px] leading-tight tracking-tight mb-3">
                      You made it!
                    </h2>
                    <p className="font-body text-white/70 text-[16px] mb-8">
                      Enjoy your {recipe.name}!
                    </p>
                    <button
                      onClick={onClose}
                      className="px-10 py-4 rounded-2xl bg-white font-body font-bold text-[16px] active:scale-95 transition-transform"
                      style={{ color: 'var(--surface-dark)' }}
                    >
                      Done cooking
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
