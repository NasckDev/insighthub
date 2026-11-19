import { createLocalInsightProvider, type InsightProvider } from '@insighthub/core';
import type { Env } from '../env';
import { createClaudeProvider } from './claude-provider';

/** Claude when ANTHROPIC_API_KEY is set; deterministic local provider otherwise. */
export function selectProvider(env: Pick<Env, 'ANTHROPIC_API_KEY' | 'ANTHROPIC_MODEL'>): InsightProvider {
  if (env.ANTHROPIC_API_KEY) {
    return createClaudeProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL });
  }
  return createLocalInsightProvider();
}
