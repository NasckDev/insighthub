import type { Insight } from '@insighthub/core';
import { describe, expect, it } from 'vitest';
import { createBoardStore } from './board-store';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

const sample = (id: string): Insight => ({
  id,
  title: `Insight ${id}`,
  note: '',
  body: 'texto',
  citations: [],
  surveyId: 's-atlas-q3',
  surveyTitle: 'Pesquisa',
  question: 'Resumo',
  scope: 'Tudo',
  createdAt: '2026-10-01T12:00:00.000Z',
});

describe('board store', () => {
  it('persists and reloads from storage', () => {
    const storage = memoryStorage();
    const first = createBoardStore(storage);
    first.add(sample('a'));
    first.add(sample('b'));
    expect(createBoardStore(storage).get().map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('ignores corrupted storage', () => {
    expect(createBoardStore(memoryStorage({ 'insighthub-board': '{nope' })).get()).toEqual([]);
    expect(createBoardStore(memoryStorage({ 'insighthub-board': '[{"id":1}]' })).get()).toEqual([]);
  });

  it('works without storage and notifies subscribers', () => {
    const store = createBoardStore(null);
    let calls = 0;
    const off = store.subscribe(() => (calls += 1));
    store.add(sample('a'));
    store.update('a', { title: 'Novo' });
    off();
    store.remove('a');
    expect(calls).toBe(2);
    expect(store.get()).toEqual([]);
  });

  it('restores a removed insight at its position (undo)', () => {
    const store = createBoardStore(null);
    store.add(sample('a'));
    store.add(sample('b'));
    const removed = store.get()[0]!;
    store.remove(removed.id);
    store.restore(removed, 0);
    expect(store.get().map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('merges imported insights and reports how many were new', () => {
    const store = createBoardStore(null);
    store.add(sample('a'));
    expect(store.merge([sample('a'), sample('c')])).toBe(1);
  });
});
