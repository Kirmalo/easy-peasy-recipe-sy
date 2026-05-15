import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
  color?: string;
  bg?: string;
  size?: number;
  ring?: string;
}

export function IconButton({
  icon: Icon,
  onClick,
  label,
  color = 'white',
  bg = 'var(--surface-dark)',
  size = 56,
  ring,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-lg font-body"
      style={{
        width: size,
        height: size,
        background: bg,
        color,
        boxShadow: ring
          ? `0 0 0 4px ${ring}, 0 10px 25px rgba(0,0,0,0.18)`
          : '0 10px 25px rgba(0,0,0,0.18)',
      }}
    >
      <Icon size={size * 0.42} strokeWidth={2.5} />
    </button>
  );
}
