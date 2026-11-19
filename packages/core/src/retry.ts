export interface RetryOptions {
  /** Number of retries after the first attempt. */
  retries: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Injectable for tests. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export class AbortError extends Error {
  constructor(message = 'Operation aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortError());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AbortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Exponential backoff: base * 2^attempt, capped at maxDelayMs. */
export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    retries,
    baseDelayMs,
    maxDelayMs = 10_000,
    signal,
    shouldRetry = () => true,
    sleep = abortableSleep,
    onRetry,
  } = options;

  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw new AbortError();
    try {
      return await operation(attempt);
    } catch (error: unknown) {
      const canRetry = attempt < retries && !isAbortError(error) && shouldRetry(error, attempt);
      if (!canRetry) throw error;
      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(error, attempt + 1, delay);
      await sleep(delay, signal);
    }
  }
}
