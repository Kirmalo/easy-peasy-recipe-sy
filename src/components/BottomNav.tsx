import { Apple, Sparkles, BookOpen, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ViewId } from '../types';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store/appStore';

interface Tab {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  activeColor?: string;
}

interface BottomNavProps {
  view: ViewId;
  setView: (v: ViewId) => void;
}

export function BottomNav({ view, setView }: BottomNavProps) {
  const { cookbookCount, makingCount } = useAppStore(useShallow((s) => ({ cookbookCount: s.cookbook.length, makingCount: s.making.length })));
  const tabs: Tab[] = [
    { id: 'kitchen',  label: 'Kitchen',  icon: Apple },
    { id: 'discover', label: 'Discover', icon: Sparkles },
    { id: 'cookbook', label: 'Cookbook', icon: BookOpen, badge: cookbookCount, activeColor: 'var(--accent-500)' },
    { id: 'making',   label: 'Cooking',  icon: Flame,   badge: makingCount,   activeColor: '#f97316' },
  ];

  return (
    <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-40 pointer-events-none">
      <div
        className="m-3 mb-4 rounded-full bg-[var(--surface-dark)] flex items-center justify-around p-1.5 pointer-events-auto shadow-2xl"
        style={{ boxShadow: '0 15px 30px -8px rgba(0,0,0,0.35)' }}
      >
        {tabs.map((t) => {
          const active = view === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              aria-label={t.badge ? `${t.label} (${t.badge})` : t.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-full transition-all"
              style={{ background: active ? (t.activeColor ?? 'var(--brand-500)') : 'transparent' }}
            >
              <Icon size={18} strokeWidth={2.5} className="text-white" aria-hidden="true" />
              {active && (
                <span className="font-body font-bold text-white text-[13px]">{t.label}</span>
              )}
              {(t.badge ?? 0) > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-[var(--accent-500)] text-[var(--text-primary)] text-[10px] font-bold flex items-center justify-center font-body">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
