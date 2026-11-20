import {
  addInsight,
  mergeInsights,
  parseBoard,
  removeInsight,
  updateInsight,
  type Insight,
} from '@insighthub/core';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'insighthub-board';

type Listener = () => void;

export interface BoardStore {
  get(): readonly Insight[];
  subscribe(listener: Listener): () => void;
  add(insight: Insight): void;
  update(id: string, patch: Partial<Pick<Insight, 'title' | 'note'>>): void;
  remove(id: string): void;
  restore(insight: Insight, index: number): void;
  merge(incoming: readonly Insight[]): number;
}

function load(storage: Storage | null): Insight[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? parseBoard(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Board persisted in localStorage; every load is validated by the core schema. */
export function createBoardStore(storage: Storage | null): BoardStore {
  let board: readonly Insight[] = load(storage);
  const listeners = new Set<Listener>();

  function commit(next: readonly Insight[]) {
    board = next;
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be full or blocked; the board then lives only in memory for this visit.
    }
    listeners.forEach((listener) => listener());
  }

  return {
    get: () => board,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    add: (insight) => commit(addInsight(board, insight)),
    update: (id, patch) => commit(updateInsight(board, id, patch)),
    remove: (id) => commit(removeInsight(board, id)),
    restore(insight, index) {
      const next = [...board];
      next.splice(Math.min(index, next.length), 0, insight);
      commit(next);
    },
    merge(incoming) {
      const before = board.length;
      commit(mergeInsights(board, incoming));
      return board.length - before;
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
  shared ??= createBoardStore(browserStorage());
  return shared;
}

export function useBoard(store: BoardStore = getBoardStore()): readonly Insight[] {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

let counter = 0;
export function newInsightId(): string {
  counter += 1;
  return `ins-${Date.now().toString(36)}-${counter}`;
}
