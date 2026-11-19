import type { Context, MiddlewareHandler } from 'hono';
import { HttpError } from './envelope';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyOf: (c: Context) => string;
  now?: () => number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 10_000;

/** Fixed-window, in-memory rate limiter. Good enough for a single instance; use Redis when scaling out. */
export function rateLimit({ limit, windowMs, keyOf, now = Date.now }: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();
  return async (c, next) => {
    const current = now();
    if (buckets.size > MAX_TRACKED_KEYS) {
      for (const [key, bucket] of buckets) if (bucket.resetAt <= current) buckets.delete(key);
    }
    const key = keyOf(c);
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > current ? existing : { count: 0, resetAt: current + windowMs };
    const updated = { ...bucket, count: bucket.count + 1 };
    buckets.set(key, updated);
    c.header('RateLimit-Limit', String(limit));
    c.header('RateLimit-Remaining', String(Math.max(0, limit - updated.count)));
    if (updated.count > limit) {
      c.header('Retry-After', String(Math.ceil((updated.resetAt - current) / 1000)));
      throw new HttpError(429, 'RATE_LIMITED', 'Muitas requisições, tente novamente em instantes');
    }
    await next();
  };
}
