import { createHash, timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { HttpError } from './envelope';

const BEARER = /^Bearer\s+(.+)$/i;

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** Constant-time comparison (hashing first makes both buffers the same length). */
export function tokensMatch(expected: string, provided: string): boolean {
  return timingSafeEqual(digest(expected), digest(provided));
}

/** Requires `Authorization: Bearer <token>` on POST requests; other methods (CORS preflight) pass. */
export function requireBearerToken(token: string): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method !== 'POST') return next();
    const provided = BEARER.exec(c.req.header('authorization') ?? '')?.[1];
    if (!provided || !tokensMatch(token, provided.trim())) {
      c.header('WWW-Authenticate', 'Bearer');
      throw new HttpError(401, 'UNAUTHORIZED', 'Token de acesso ausente ou inválido');
    }
    return next();
  };
}
