import {
  isAbortError,
  type Citation,
  type ResponseFilters,
  type SynthesisEvent,
  type SynthesisFocus,
} from '@insighthub/core';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { DataClient } from '../data';

export type SynthesisStatus = 'idle' | 'streaming' | 'done' | 'cancelled' | 'error';

export interface SynthesisState {
  status: SynthesisStatus;
  text: string;
  citations: Citation[];
  provider?: string;
  sourceCount?: number;
  error?: string;
}

type Action =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'fail'; message: string }
  | { type: 'event'; event: SynthesisEvent };

const INITIAL: SynthesisState = { status: 'idle', text: '', citations: [] };

export function synthesisReducer(state: SynthesisState, action: Action): SynthesisState {
  switch (action.type) {
    case 'start':
      return { ...INITIAL, status: 'streaming' };
    case 'cancel':
      return state.status === 'streaming' ? { ...state, status: 'cancelled' } : state;
    case 'fail':
      return { ...state, status: 'error', error: action.message };
    case 'event': {
      const { event } = action;
      if (event.type === 'meta')
        return { ...state, provider: event.provider, sourceCount: event.sourceCount };
      if (event.type === 'delta') return { ...state, text: state.text + event.text };
      if (event.type === 'citation') return { ...state, citations: [...state.citations, event.citation] };
      if (event.type === 'done') return { ...state, status: 'done' };
      return { ...state, status: 'error', error: event.message };
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Falha ao gerar a síntese.';
}

export function useSynthesis(
  client: DataClient,
  surveyId: string,
  filters: ResponseFilters,
  focus?: SynthesisFocus,
) {
  const [state, dispatch] = useReducer(synthesisReducer, INITIAL);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    dispatch({ type: 'cancel' });
  }, []);

  const start = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    dispatch({ type: 'start' });
    try {
      for await (const event of client.streamSynthesis(surveyId, filters, current.signal, focus)) {
        if (current.signal.aborted) return;
        dispatch({ type: 'event', event });
      }
    } catch (error: unknown) {
      if (isAbortError(error) || current.signal.aborted) return;
      dispatch({ type: 'fail', message: messageOf(error) });
    }
  }, [client, surveyId, filters, focus]);

  useEffect(() => () => controller.current?.abort(), []);

  return { state, start, cancel };
}
