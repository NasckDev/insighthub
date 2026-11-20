import type { SynthesisEvent } from '@insighthub/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DataClient } from '../data';
import { INTERRUPTED_MESSAGE, synthesisReducer, useSynthesis, type SynthesisState } from './use-synthesis';

const streaming: SynthesisState = { status: 'streaming', text: 'abc', citations: [] };

describe('synthesisReducer', () => {
  it('turns a stream that ends without done or error into an interruption', () => {
    const next = synthesisReducer(streaming, { type: 'end' });
    expect(next.status).toBe('error');
    expect(next.error).toBe(INTERRUPTED_MESSAGE);
    expect(next.text).toBe('abc');
  });

  it('leaves finished, cancelled and failed runs alone', () => {
    for (const status of ['done', 'cancelled', 'error', 'idle'] as const) {
      const state: SynthesisState = { ...streaming, status };
      expect(synthesisReducer(state, { type: 'end' })).toBe(state);
    }
  });

  it('records how many responses were read and how many matched', () => {
    const next = synthesisReducer(streaming, {
      type: 'event',
      event: { type: 'meta', provider: 'claude:x', sourceCount: 80, totalCount: 640 },
    });
    expect(next).toMatchObject({ sourceCount: 80, totalCount: 640, provider: 'claude:x' });
  });
});

function clientWith(events: SynthesisEvent[]): DataClient {
  return {
    async *streamSynthesis() {
      for (const event of events) yield event;
    },
  } as unknown as DataClient;
}

describe('useSynthesis', () => {
  it('does not stay stuck on "streaming" when the stream closes early', async () => {
    const client = clientWith([
      { type: 'meta', provider: 'x', sourceCount: 3 },
      { type: 'delta', text: 'parcial ' },
    ]);
    const { result } = renderHook(() => useSynthesis(client, 's-atlas-q3', {}));
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.error).toBe(INTERRUPTED_MESSAGE);
    expect(result.current.state.text).toBe('parcial ');
  });

  it('finishes normally when the stream ends with done', async () => {
    const client = clientWith([{ type: 'delta', text: 'ok' }, { type: 'done' }]);
    const { result } = renderHook(() => useSynthesis(client, 's-atlas-q3', {}));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state.status).toBe('done');
  });
});
