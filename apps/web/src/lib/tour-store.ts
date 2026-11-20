import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'insighthub-tour';

interface TourState {
  open: boolean;
  step: number;
  done: boolean;
}

function readDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}

let state: TourState = { open: false, step: 0, done: readDone() };
const listeners = new Set<() => void>();

function set(next: TourState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function remember() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    // Blocked storage: the chip will simply show again next visit.
  }
}

/**
 * The tour never opens by itself: it starts when the person asks (the chip on the dashboard, the
 * command palette or the menu), so it can never cover the numbers they came to read.
 */
export const tour = {
  start: () => set({ open: true, step: 0, done: state.done }),
  goTo: (step: number) => set({ ...state, step }),
  finish: () => {
    remember();
    set({ open: false, step: 0, done: true });
  },
  /** Test helper: forget everything. */
  reset: () => set({ open: false, step: 0, done: false }),
};

export function useTour(): TourState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
