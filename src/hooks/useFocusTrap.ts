import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a modal/dialog while it is open.
 *
 * Without this, Tab and Shift+Tab can move focus out of an open dialog and
 * into the (visually dimmed, but still interactive) content behind it --
 * disorienting for keyboard and screen-reader users. This hook:
 *  - moves focus into the dialog when it opens (the first focusable element,
 *    or the dialog container itself if it has none),
 *  - cycles Tab/Shift+Tab only through focusable elements inside the dialog,
 *  - and restores focus to whatever was focused before the dialog opened,
 *    once it closes.
 *
 * Usage: attach the returned ref to the dialog's outer element (the one
 * carrying role="dialog"), and pass whether the dialog is currently open.
 * This hook does not handle Escape-to-close -- callers wire that separately,
 * since some dialogs need extra logic there (e.g. confirming unsaved changes).
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isOpen: boolean) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;

    const getFocusable = (): HTMLElement[] => {
      if (!container) return [];
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    };

    // Defer to the next frame so the dialog's own entrance animation/DOM has
    // mounted before we try to move focus into it.
    const raf = requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return;

      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
