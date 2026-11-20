import {
  addInsight,
  insightSchema,
  mergeInsights,
  parseBoard,
  removeInsight,
  updateInsight,
  type Insight,
} from '@insighthub/core';
import { useSyncExternalStore } from 'react';

export const STORAGE_KEY = 'insighthub-board';
/** v1 stored a bare array; v2 wraps it so future changes can migrate instead of discarding data. */
export const STORAGE_VERSION = 2;

type Listener = () => void;

export interface BoardStore {
  get(): readonly Insight[];
  subscribe(listener: Listener): () => void;
  /** Returns false (and changes nothing) when the insight does not pass validation. */
  add(insight: Insight): boolean;
  update(id: string, patch: Partial<Pick<Insight, 'title' | 'note'>>): void;
  remove(id: string): void;
  restore(insight: Insight, index: number): void;
  merge(incoming: readonly Insight[]): number;
  /** Stops listening to other tabs (tests and hot reload). */
  dispose(): void;
}

/** Reads v1 (array) and v2 (`{ version, items }`) payloads; anything else, or a broken one, is an empty board. */
export function parseStored(raw: string | null | undefined): Insight[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) return parseBoard(value);
    if (value && typeof value === 'object' && 'items' in value) return parseBoard((value as { items: unknown }).items);
  } catch {
    // Corrupted JSON: start clean rather than break the screen.
  }
  return [];
}

function load(storage: Storage | null): Insight[] {
  try {
    return parseStored(storage?.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

interface StoreOptions {
  /** Follow changes made in other tabs through the `storage` event. */
  listenToOtherTabs?: boolean;
}

/** Board persisted in localStorage; every load and every write goes through the core schema. */
export function createBoardStore(storage: Storage | null, options: StoreOptions = {}): BoardStore {
  let board: readonly Insight[] = load(storage);
  const listeners = new Set<Listener>();
  const notify = () => listeners.forEach((listener) => listener());

  function commit(next: readonly Insight[]) {
    // Re-validating on write also drops anything beyond the size cap, so storage never grows unbounded.
    board = parseBoard(next);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: board }));
    } catch {
      // Storage may be full or blocked; the board then lives only in memory for this visit.
    }
    notify();
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    board = load(storage);
    notify();
  }
  if (options.listenToOtherTabs && typeof window !== 'undefined') window.addEventListener('storage', onStorage);

  return {
    get: () => board,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add(insight) {
      if (!insightSchema.safeParse(insight).success) return false;
      commit(addInsight(board, insight));
      return true;
    },
    update: (id, patch) => commit(updateInsight(board, id, patch)),
    remove: (id) => commit(removeInsight(board, id)),
    restore(insight, index) {
      const next = board.filter((item) => item.id !== insight.id);
      next.splice(Math.min(index, next.length), 0, insight);
      commit(next);
    },
    merge(incoming) {
      const before = board.length;
      commit(mergeInsights(board, incoming));
      return board.length - before;
    },
    dispose() {
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
    },
  };
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let shared: BoardStore | null = null;

export function getBoardStore(): BoardStore {
  shared ??= createBoardStore(browserStorage(), { listenToOtherTabs: true });
  return shared;
}

export function useBoard(store: BoardStore = getBoardStore()): readonly Insight[] {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

let counter = 0;
export function newInsightId(): string {
  counter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `ins-${Date.now().toString(36)}-${counter}-${random}`;
}
