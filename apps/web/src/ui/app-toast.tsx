import { useCallback } from 'react';

export type ToastKind = 'success' | 'info' | 'error';

export interface ToastInput {
  message: string;
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

type Show = (toast: ToastInput) => void;

let show: Show | null = null;
const waiting: ToastInput[] = [];

/** Called by `ToastHost` once the notification code has loaded; anything shown before that is replayed. */
export function registerToastHost(next: Show | null): void {
  show = next;
  if (next) for (const toast of waiting.splice(0)) next(toast);
}

/**
 * Feedback that leaves on its own and pauses while the pointer or focus is on it (so nobody loses the
 * "Desfazer" button while reaching for it). The notification code (about 20 kB gzip) lives in `ToastHost`,
 * which `AppProvider` loads right after the first paint instead of at startup.
 */
export function useToast(): Show {
  return useCallback((input: ToastInput) => {
    if (show) show(input);
    else waiting.push(input);
  }, []);
}
