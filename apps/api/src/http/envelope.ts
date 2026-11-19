import type { z } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: Record<string, unknown> | null;
}

export function ok<T>(data: T, meta: Record<string, unknown> | null = null): ApiEnvelope<T> {
  return { success: true, data, error: null, meta };
}

export function fail(error: ApiError): ApiEnvelope<null> {
  return { success: false, data: null, error, meta: null };
}

export type HttpStatus = 400 | 404 | 413 | 429 | 500;

export class HttpError extends Error {
  constructor(
    readonly status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Validates untrusted input at the boundary and turns Zod issues into a 400 envelope. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new HttpError(400, 'VALIDATION_ERROR', 'Parâmetros inválidos', details);
  }
  return result.data;
}
