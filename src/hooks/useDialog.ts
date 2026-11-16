import { useEffect, useLayoutEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last — only the top one reacts to Escape / Tab.
const stack: object[] = [];

/**
 * Modal behaviour for sheets and full-screen overlays: moves focus into the dialog,
 * traps Tab inside it, closes on Escape and restores focus on close.
 * Spread the returned props onto the dialog's root element.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void, label: string) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const token = {};
    stack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus the container (not the first input) so mobile keyboards don't pop open.
    ref.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, []);

  return { ref, role: 'dialog', 'aria-modal': true, 'aria-label': label, tabIndex: -1 } as const;
}
