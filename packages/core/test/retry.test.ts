import { describe, expect, it, vi } from 'vitest';
import { AbortError, backoffDelay, withRetry } from '../src/retry';

const noSleep = () => Promise.resolve();

describe('backoffDelay', () => {
  it('grows exponentially and respects the cap', () => {
    expect([0, 1, 2, 3].map((a) => backoffDelay(a, 100, 500))).toEqual([100, 200, 400, 500]);
  });
});

describe('withRetry', () => {
  it('retries until the operation succeeds', async () => {
    const op = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');
    await expect(withRetry(op, { retries: 2, baseDelayMs: 1, sleep: noSleep })).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('gives up after the configured retries', async () => {
    const op = vi.fn().mockRejectedValue(new Error('down'));
    await expect(withRetry(op, { retries: 2, baseDelayMs: 1, sleep: noSleep })).rejects.toThrow('down');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable errors', async () => {
    const op = vi.fn().mockRejectedValue(new Error('400'));
    const options = { retries: 3, baseDelayMs: 1, sleep: noSleep, shouldRetry: () => false };
    await expect(withRetry(op, options)).rejects.toThrow('400');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('stops immediately when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const op = vi.fn().mockResolvedValue('never');
    const options = { retries: 3, baseDelayMs: 1, signal: controller.signal };
    await expect(withRetry(op, options)).rejects.toBeInstanceOf(AbortError);
    expect(op).not.toHaveBeenCalled();
  });

  it('reports each retry with its backoff delay', async () => {
    const onRetry = vi.fn();
    const op = vi
      .fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockResolvedValue(1);
    await withRetry(op, { retries: 3, baseDelayMs: 10, sleep: noSleep, onRetry });
    expect(onRetry.mock.calls.map((call) => call[2])).toEqual([10, 20]);
  });
});
