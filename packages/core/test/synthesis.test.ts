import { describe, expect, it } from 'vitest';
import { generateSeed } from '../src/seed';
import {
  buildExtractiveSynthesis,
  createLocalInsightProvider,
  extractCitations,
} from '../src/synthesis';
import type { SynthesisEvent } from '../src/types';

const { surveys, responses } = generateSeed();
const survey = surveys[0]!;
const sample = responses.filter((r) => r.surveyId === survey.id);

describe('buildExtractiveSynthesis', () => {
  it('cites only responses that exist in the source set', () => {
    const { text, citations } = buildExtractiveSynthesis({ survey, responses: sample });
    const ids = new Set(sample.map((r) => r.id));
    expect(citations.length).toBeGreaterThan(0);
    for (const c of citations) {
      expect(ids.has(c.responseId)).toBe(true);
      expect(text).toContain(`[#${c.responseId}]`);
    }
  });

  it('is deterministic', () => {
    const a = buildExtractiveSynthesis({ survey, responses: sample });
    const b = buildExtractiveSynthesis({ survey, responses: sample });
    expect(a).toEqual(b);
  });

  it('handles an empty selection', () => {
    expect(buildExtractiveSynthesis({ survey, responses: [] }).citations).toEqual([]);
  });
});

describe('createLocalInsightProvider', () => {
  it('streams meta, deltas, citations and done in order', async () => {
    const events: SynthesisEvent[] = [];
    const provider = createLocalInsightProvider({ chunkDelayMs: 0 });
    const signal = new AbortController().signal;
    for await (const event of provider.stream({ survey, responses: sample }, signal)) {
      events.push(event);
    }
    expect(events[0]).toMatchObject({ type: 'meta', sourceCount: sample.length });
    expect(events.at(-1)).toEqual({ type: 'done' });
    expect(events.some((e) => e.type === 'delta')).toBe(true);
    expect(events.some((e) => e.type === 'citation')).toBe(true);
  });

  it('stops when the signal is aborted', async () => {
    const controller = new AbortController();
    const provider = createLocalInsightProvider({ chunkDelayMs: 5 });
    const iterator = provider.stream({ survey, responses: sample }, controller.signal);
    await iterator.next();
    controller.abort();
    await expect(iterator.next()).rejects.toThrow(/abort/i);
  });
});

describe('extractCitations', () => {
  it('ignores ids that are not in the sources (no invented citations)', () => {
    const real = sample[0]!;
    const text = `Veja [#${real.id}] e [#fake-9999] e [#${real.id}]`;
    expect(extractCitations(text, sample)).toEqual([{ responseId: real.id, quote: real.comment }]);
  });
});
