import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Minus, Plus, Clock, Pause, Play, RotateCcw } from 'lucide-react';
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

interface TimerState {
  total: number;
  remaining: number;
  running: boolean;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

const TIMER_PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '20m', seconds: 1200 },
  { label: '30m', seconds: 1800 },
];

function detectSeconds(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:to\s*\d+\s*)?(hours?|hrs?|minutes?|mins?|seconds?|secs?)/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('hour') || unit.startsWith('hr')) return val * 3600;
  if (unit.startsWith('min')) return val * 60;
  return val;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    [0, 0.35, 0.7].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.28);
    });
  } catch {}
}

export function CookingStepsView({ recipeId, onClose, onDone, onRate, extraRecipes }: CookingStepsViewProps) {
  const recipe = [...(extraRecipes ?? []), ...RECIPES].find((r) => r.id === recipeId)!;
  const theme = THEMES[recipe.theme] ?? THEMES.tomato;
  const imageUrl = useRecipeImage(recipeId, recipe.name);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // 0 = intro, 1..N = steps, N+1 = done
  const totalSteps = recipe.steps.length;
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [servings, setServings] = useState(recipe.servings);
  const scaleFactor = servings / recipe.servings;

  const [timer, setTimer] = useState<TimerState | null>(null);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const isIntro = stepIndex === 0;
  const isDone = stepIndex === totalSteps + 1;

  // Countdown tick
  useEffect(() => {
    if (!timer?.running) return;
    const id = setInterval(() => {
      const t = timerRef.current;
      if (!t?.running) return;
      if (t.remaining <= 1) {
        playBeep();
        navigator.vibrate?.([300, 100, 300, 100, 300]);
        setTimer({ ...t, remaining: 0, running: false });
        setTimerDone(true);
        setTimeout(() => setTimerDone(false), 4000);
      } else {
        setTimer({ ...t, remaining: t.remaining - 1 });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timer?.running]);

  const startTimer = (seconds: number) => {
    setTimer({ total: seconds, remaining: seconds, running: true });
    setShowTimerPicker(false);
    setTimerDone(false);
  };

  const navigate = (nextIndex: number, direction: number) => {
    setDir(direction);
    setShowIngredients(false);
    setShowTimerPicker(false);
    setStepIndex(nextIndex);
  };

  const goNext = () => navigate(Math.min(stepIndex + 1, totalSteps + 1), 1);
  const goPrev = () => navigate(Math.max(stepIndex - 1, 0), -1);

  const showFallback = !imageUrl || imgError || !imgLoaded;

  // Detected time for current step
  const detectedSeconds = !isIntro && !isDone ? detectSeconds(recipe.steps[stepIndex - 1]) : null;

  const isUrgent = timer !== null && timer.remaining <= 30 && timer.running;

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

                {/* Intro content — flex column prevents overlap */}
                {isIntro && (
                  <div className="absolute inset-0 flex flex-col px-6 pt-6 pb-9">
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

                    <div style={{ flex: '1 0 10px' }} />

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
                      <div className="flex items-center gap-2">
                        {/* Timer button */}
                        <button
                          onClick={() => setShowTimerPicker(true)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-full font-body font-bold text-[11px] text-white active:scale-95 transition-transform"
                          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                        >
                          <Clock size={13} strokeWidth={2.5} className="text-white" />
                          {detectedSeconds ? formatTime(detectedSeconds) : 'Timer'}
                        </button>
                        {/* Ingredients button */}
                        <button
                          onClick={() => setShowIngredients(true)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-full font-body font-bold text-[11px] text-white active:scale-95 transition-transform"
                          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                        >
                          🧂
                        </button>
                      </div>
                    </div>

                    {/* Step text */}
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

                    {/* Ingredient sheet */}
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

                    {/* Timer picker sheet */}
                    <AnimatePresence>
                      {showTimerPicker && (
                        <motion.div
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute inset-0 rounded-[28px] flex flex-col"
                          style={{ background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(20px)' }}
                          onClick={() => setShowTimerPicker(false)}
                        >
                          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
                            <p className="font-body text-[11px] uppercase tracking-widest text-white/50 font-semibold">
                              Set a timer
                            </p>
                            <button
                              onClick={() => setShowTimerPicker(false)}
                              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
                            >
                              <X size={14} strokeWidth={2.5} className="text-white" />
                            </button>
                          </div>
                          <div
                            className="flex-1 px-6 pb-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {detectedSeconds && (
                              <button
                                onClick={() => startTimer(detectedSeconds)}
                                className="w-full mb-4 py-4 rounded-2xl font-body font-bold text-[17px] text-white active:scale-95 transition-transform flex items-center justify-center gap-2"
                                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)' }}
                              >
                                <Clock size={18} strokeWidth={2.5} />
                                {formatTime(detectedSeconds)} — from this step
                              </button>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                              {TIMER_PRESETS.map(({ label, seconds }) => (
                                <button
                                  key={label}
                                  onClick={() => startTimer(seconds)}
                                  className="py-3 rounded-2xl font-body font-bold text-[15px] text-white active:scale-95 transition-transform"
                                  style={{ background: 'rgba(255,255,255,0.12)' }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="font-body text-white/25 text-[11px] text-center pb-5 flex-shrink-0">
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
                    <div className="text-[90px] leading-none mb-4" style={{ animation: 'pop 0.5s ease-out' }}>
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

          {/* Timer strip — persistent across steps */}
          <AnimatePresence>
            {(timer !== null || timerDone) && !isIntro && !isDone && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 mt-3 px-1"
              >
                {/* Progress bar */}
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: timerDone ? '0%' : timer ? `${(timer.remaining / timer.total) * 100}%` : '0%',
                      background: isUrgent ? '#FCA5A5' : 'white',
                    }}
                  />
                </div>
                {/* Time display */}
                <span
                  className="font-body font-bold text-[18px] tabular-nums min-w-[48px] text-center"
                  style={{ color: timerDone ? '#86EFAC' : isUrgent ? '#FCA5A5' : 'white' }}
                >
                  {timerDone ? 'Done!' : timer ? formatTime(timer.remaining) : ''}
                </span>
                {/* Controls */}
                {!timerDone && timer && (
                  <>
                    <button
                      onClick={() => setTimer((t) => t ? { ...t, running: !t.running } : null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      {timer.running
                        ? <Pause size={14} strokeWidth={2.5} className="text-white" />
                        : <Play size={14} strokeWidth={2.5} className="text-white" />}
                    </button>
                    <button
                      onClick={() => { setTimer(null); setTimerDone(false); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      <RotateCcw size={14} strokeWidth={2.5} className="text-white" />
                    </button>
                  </>
                )}
                {timerDone && (
                  <button
                    onClick={() => setTimerDone(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <X size={14} strokeWidth={2.5} className="text-white" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          {!isIntro && !isDone && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {recipe.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDir(i + 1 > stepIndex ? 1 : -1);
                    setShowIngredients(false);
                    setShowTimerPicker(false);
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
