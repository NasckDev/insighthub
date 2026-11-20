import type { Insight } from '@insighthub/core';
import { describe, expect, it } from 'vitest';
import { createBoardStore, parseStored, STORAGE_KEY, STORAGE_VERSION } from './board-store';

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

  it('writes a versioned payload and migrates the old bare array', () => {
    const storage = memoryStorage();
    createBoardStore(storage).add(sample('a'));
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as { version: number; items: Insight[] };
    expect(saved.version).toBe(STORAGE_VERSION);
    expect(saved.items.map((i) => i.id)).toEqual(['a']);
    expect(parseStored(JSON.stringify([sample('legacy')])).map((i) => i.id)).toEqual(['legacy']);
    expect(parseStored('{"version":9,"items":"nope"}')).toEqual([]);
    expect(parseStored(null)).toEqual([]);
  });

  it('dedupes ids from storage and refuses invalid insights', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([sample('a'), sample('a'), sample('b')]) });
    const store = createBoardStore(storage);
    expect(store.get().map((i) => i.id)).toEqual(['a', 'b']);
    expect(store.add({ ...sample('c'), title: '   ' })).toBe(false);
    expect(store.add(sample('c'))).toBe(true);
    expect(store.add({ ...sample('c'), title: 'Substituído' })).toBe(true);
    expect(store.get().filter((i) => i.id === 'c')).toHaveLength(1);
  });

  it('follows changes made in another tab', () => {
    const storage = memoryStorage();
    const store = createBoardStore(storage, { listenToOtherTabs: true });
    let calls = 0;
    store.subscribe(() => (calls += 1));
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, items: [sample('from-other-tab')] }));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    expect(store.get().map((i) => i.id)).toEqual(['from-other-tab']);
    expect(calls).toBe(1);
    store.dispose();
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    expect(calls).toBe(1);
  });
});
