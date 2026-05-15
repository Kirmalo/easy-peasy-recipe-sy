import { Apple, Sparkles, BookOpen, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ViewId = 'kitchen' | 'discover' | 'cookbook' | 'making';

interface Tab {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface BottomNavProps {
  view: ViewId;
  setView: (v: ViewId) => void;
  cookbookCount: number;
  makingCount: number;
}

export function BottomNav({ view, setView, cookbookCount, makingCount }: BottomNavProps) {
  const tabs: Tab[] = [
    { id: 'kitchen',  label: 'Kitchen',  icon: Apple },
    { id: 'discover', label: 'Discover', icon: Sparkles },
    { id: 'cookbook', label: 'Cookbook', icon: BookOpen, badge: cookbookCount },
    { id: 'making',   label: 'Cooking',  icon: Flame,   badge: makingCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-40 pointer-events-none">
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
              className="relative flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-full transition-all"
              style={{ background: active ? 'var(--brand-500)' : 'transparent' }}
            >
              <Icon size={18} strokeWidth={2.5} className="text-white" />
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
    </div>
  );
}
