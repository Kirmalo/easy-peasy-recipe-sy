import type { LucideIcon } from 'lucide-react';

interface PillProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  color?: string;
  textColor?: string;
}

export function Pill({ children, icon: Icon, color = 'rgba(255,255,255,0.2)', textColor = 'white' }: PillProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold font-body"
      style={{ backgroundColor: color, color: textColor, backdropFilter: 'blur(8px)' }}
    >
      {Icon && <Icon size={14} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
