import {
  isAbortError,
  type Citation,
  type ResponseFilters,
  type SynthesisEvent,
  type SynthesisFocus,
} from '@insighthub/core';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { DataError, type DataClient } from '../data';

export type SynthesisStatus = 'idle' | 'streaming' | 'done' | 'cancelled' | 'error';

export interface SynthesisState {
  status: SynthesisStatus;
  text: string;
  citations: Citation[];
  provider?: string;
  sourceCount?: number;
  /** How many responses matched the filters (can be more than `sourceCount`, the ones actually read). */
  totalCount?: number;
  truncated?: boolean;
  error?: string;
  /** The API answered 401/403: the way out is to give it a token, not to try again. */
  needsToken?: boolean;
}

type Action =
  | { type: 'start' }
  | { type: 'cancel' }
  | { type: 'fail'; message: string; needsToken?: boolean }
  | { type: 'end' }
  | { type: 'event'; event: SynthesisEvent };

export const INTERRUPTED_MESSAGE = 'A conexão foi interrompida antes do fim da síntese.';

const INITIAL: SynthesisState = { status: 'idle', text: '', citations: [] };

export function synthesisReducer(state: SynthesisState, action: Action): SynthesisState {
  switch (action.type) {
    case 'start':
      return { ...INITIAL, status: 'streaming' };
    case 'cancel':
      return state.status === 'streaming' ? { ...state, status: 'cancelled' } : state;
    case 'fail':
      return { ...state, status: 'error', error: action.message, needsToken: action.needsToken };
    case 'end':
      // A stream that closes without `done` or `error` is a dropped connection, not a finished answer.
      return state.status === 'streaming' ? { ...state, status: 'error', error: INTERRUPTED_MESSAGE } : state;
    case 'event': {
      const { event } = action;
      if (event.type === 'meta')
        return {
          ...state,
          provider: event.provider,
          sourceCount: event.sourceCount,
          totalCount: event.totalCount,
          truncated: event.truncated,
        };
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
      if (!current.signal.aborted) dispatch({ type: 'end' });
    } catch (error: unknown) {
      if (isAbortError(error) || current.signal.aborted) return;
      dispatch({
        type: 'fail',
        message: messageOf(error),
        needsToken: error instanceof DataError && error.code === 'AUTH',
      });
    }
  }, [client, surveyId, filters, focus]);

  useEffect(() => () => controller.current?.abort(), []);

  return { state, start, cancel };
}
