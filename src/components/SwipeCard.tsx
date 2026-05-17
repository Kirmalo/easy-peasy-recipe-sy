import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Clock, Gauge, Utensils, Sparkles, Apple, Leaf } from 'lucide-react';
import { Pill } from './Pill';
import { THEMES } from '../data/themes';
import { CUISINE_LABELS } from '../data/recipes';
import { useRecipeImage } from '../hooks/useRecipeImage';
import type { Recipe, MatchResult, SwipeDirection } from '../types';

interface SwipeCardProps {
  recipe: Recipe;
  match: MatchResult;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (dir: SwipeDirection) => void;
  onTap: () => void;
  forcedExit: SwipeDirection | null;
}

export function SwipeCard({ recipe, match, isTop, stackIndex, onSwipe, onTap, forcedExit }: SwipeCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const theme = THEMES[recipe.theme] ?? THEMES.tomato;
  const imageUrl = useRecipeImage(recipe.id, recipe.name);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOp = useTransform(x, [0, 110], [0, 1]);
  const passOp = useTransform(x, [-110, 0], [1, 0]);
  // Framer Motion v12 fires onTap even after a drag completes. Track whether
  // a drag started so we can suppress the spurious tap.
  const wasDraggingRef = useRef(false);

  useEffect(() => {
    if (!forcedExit || !isTop) return;
    const targetX = forcedExit === 'right' ? 650 : -650;
    animate(x, targetX, { duration: 0.32, ease: [0.4, 0, 0.2, 1] });
    const timer = setTimeout(() => onSwipe(forcedExit), 350);
    return () => clearTimeout(timer);
  }, [forcedExit, isTop, x, onSwipe]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 110) {
      const dir: SwipeDirection = info.offset.x > 0 ? 'right' : 'left';
      animate(x, dir === 'right' ? 650 : -650, { duration: 0.32, ease: [0.4, 0, 0.2, 1] });
      setTimeout(() => onSwipe(dir), 350);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 });
    }
    // Reset drag flag after onTap would have fired
    setTimeout(() => { wasDraggingRef.current = false; }, 50);
  };

  const handleTap = () => {
    if (wasDraggingRef.current) return;
    onTap();
  };

  const showFallback = !imageUrl || imgError || !imgLoaded;
  const scale = isTop ? 1 : 1 - stackIndex * 0.04;
  const ty = isTop ? 0 : stackIndex * 10;

  return (
    <motion.div
      className="absolute inset-0 rounded-[28px] overflow-hidden select-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: ty,
        background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)`,
        boxShadow: isTop
          ? '0 30px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.04)'
          : '0 15px 30px -10px rgba(0,0,0,0.2)',
        zIndex: 10 - stackIndex,
        pointerEvents: isTop ? 'auto' : 'none',
        cursor: isTop ? 'grab' : 'default',
        touchAction: 'none',
      }}
      animate={{ scale, y: ty }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={() => { wasDraggingRef.current = true; }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onTap={isTop ? handleTap : undefined}
    >
      {/* Fallback: gradient + emoji */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${showFallback ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.to} 100%)` }}
      >
        <div className="absolute inset-0 grain opacity-30" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full" style={{ background: 'rgba(0,0,0,0.10)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-[180px] leading-none"
            style={{
              filter: 'drop-shadow(0 12px 25px rgba(0,0,0,0.25))',
              animation: isTop ? 'shimmer 6s ease-in-out infinite' : 'none',
            }}
          >
            {recipe.emoji}
          </div>
        </div>
      </div>

      {/* Real photo */}
      {imageUrl && !imgError && (
        <img
          src={imageUrl}
          alt={recipe.name}
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ userSelect: 'none' }}
        />
      )}

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 22%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      {/* Warm color tint */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{ background: `linear-gradient(170deg, ${theme.from}33 0%, transparent 60%)` }}
      />

      {/* Top row */}
      <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2">
          {match.have > 0 ? (
            <Pill icon={Sparkles} color="rgba(255,255,255,0.92)" textColor="var(--text-primary)">
              {match.have}/{match.need} match
            </Pill>
          ) : (
            <Pill icon={Apple} color="rgba(255,255,255,0.92)" textColor="var(--text-primary)">New idea</Pill>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[26px] backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 6px 14px -2px rgba(0,0,0,0.25)' }}
          >
            {recipe.emoji}
          </div>
          {recipe.dietary.includes('vegetarian') && (
            <Pill icon={Leaf} color="rgba(255,255,255,0.92)" textColor="var(--success-700)">Veggie</Pill>
          )}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-7 pointer-events-none">
        <h2
          className="font-display font-semibold text-white text-[36px] leading-[1.02] mb-2 tracking-tight"
          style={{ textShadow: '0 2px 14px rgba(0,0,0,0.35)' }}
        >
          {recipe.name}
        </h2>
        <p
          className="font-body text-white/90 text-[15px] leading-snug mb-4 line-clamp-2"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
        >
          {recipe.description}
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill icon={Clock} color="rgba(255,255,255,0.22)">{recipe.cookTime} min</Pill>
          <Pill icon={Gauge} color="rgba(255,255,255,0.22)">{CUISINE_LABELS[recipe.difficulty]}</Pill>
          <Pill icon={Utensils} color="rgba(255,255,255,0.22)">{CUISINE_LABELS[recipe.mealType]}</Pill>
        </div>
        {match.have > 0 && match.have < match.need && (
          <p
            className="font-body text-white/80 text-[12px] mt-3"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
          >
            You'll need:{' '}
            {match.missing.slice(0, 3).join(', ')}
            {match.missing.length > 3 ? `, +${match.missing.length - 3} more` : ''}
          </p>
        )}
      </div>

      {/* Swipe overlays */}
      <motion.div
        className="absolute top-12 left-8 pointer-events-none"
        style={{ opacity: likeOp, rotate: -12 }}
      >
        <div
          className="border-[5px] border-white rounded-2xl px-5 py-2 font-display text-white text-4xl font-extrabold tracking-wide"
          style={{
            textShadow: '0 4px 10px rgba(0,0,0,0.3)',
            background: 'rgba(var(--brand-rgb),0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          LET'S MAKE IT
        </div>
      </motion.div>
      <motion.div
        className="absolute top-12 right-8 pointer-events-none"
        style={{ opacity: passOp, rotate: 12 }}
      >
        <div
          className="border-[5px] border-white rounded-2xl px-5 py-2 font-display text-white text-4xl font-extrabold tracking-wide"
          style={{
            textShadow: '0 4px 10px rgba(0,0,0,0.3)',
            background: 'rgba(var(--ink-rgb),0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          NEXT
        </div>
      </motion.div>
    </motion.div>
  );
}
