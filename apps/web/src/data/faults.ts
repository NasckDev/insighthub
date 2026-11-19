import { useSyncExternalStore } from 'react';

/**
 * Failure simulation for the demo adapter, so the error and partial states can be seen
 * without breaking anything for real.
 */
export type FaultMode = 'none' | 'fail-next' | 'partial';

export interface FaultController {
  getMode(): FaultMode;
  setMode(mode: FaultMode): void;
  /** True once when the mode is `fail-next`; the mode then goes back to `none`. */
  consumeFailure(): boolean;
  subscribe(listener: () => void): () => void;
}

export function createFaultController(initial: FaultMode = 'none'): FaultController {
  let mode = initial;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    getMode: () => mode,
    setMode(next) {
      mode = next;
      notify();
    },
    consumeFailure() {
      if (mode !== 'fail-next') return false;
      mode = 'none';
      notify();
      return true;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useFaultMode(controller: FaultController): FaultMode {
  return useSyncExternalStore(controller.subscribe, controller.getMode, controller.getMode);
}
