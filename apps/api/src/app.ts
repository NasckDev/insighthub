import type { InsightProvider } from '@insighthub/core';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requireBearerToken } from './http/auth';
import { fail, HttpError, ok } from './http/envelope';
import { rateLimit } from './http/rate-limit';
import { logger } from './logger';
import type { SurveyRepository } from './repositories/survey-repository';
import { surveyRoutes } from './routes/surveys';
import { synthesisRoutes } from './routes/synthesis';

export interface AppDependencies {
  repo: SurveyRepository;
  provider: InsightProvider;
  corsOrigins: string[];
  rateLimitPerMinute: number;
  synthesisLimitPerMinute: number;
  /** When set, POST /synthesis requires `Authorization: Bearer <token>`. */
  synthesisToken?: string;
  clientKey?: (c: Context) => string;
}

const MINUTE_MS = 60_000;
const MAX_BODY_BYTES = 16 * 1024;

export function createApp(deps: AppDependencies) {
  const keyOf = deps.clientKey ?? (() => 'global');
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use('/api/*', cors({ origin: deps.corsOrigins, allowMethods: ['GET', 'POST'], maxAge: 600 }));
  app.use('/api/*', rateLimit({ limit: deps.rateLimitPerMinute, windowMs: MINUTE_MS, keyOf }));
  app.use(
    '/api/surveys/:id/synthesis',
    // Auth first, so unauthenticated calls never spend the rate limit or reach a paid provider.
    ...(deps.synthesisToken ? [requireBearerToken(deps.synthesisToken)] : []),
    rateLimit({ limit: deps.synthesisLimitPerMinute, windowMs: MINUTE_MS, keyOf }),
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: () => {
        throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Corpo da requisição muito grande');
      },
    }),
  );

  app.get('/api/health', (c) => c.json(ok({ status: 'ok', provider: deps.provider.name })));
  app.route('/api/surveys', surveyRoutes(deps.repo));
  app.route('/api/surveys', synthesisRoutes(deps.repo, deps.provider));

  app.notFound((c) => c.json(fail({ code: 'NOT_FOUND', message: 'Rota não encontrada' }), 404));
  app.onError((error, c) => {
    if (error instanceof HttpError) {
      const body = fail({ code: error.code, message: error.message, details: error.details });
      return c.json(body, error.status);
    }
    logger.error('Unhandled error', error);
    return c.json(fail({ code: 'INTERNAL_ERROR', message: 'Erro interno inesperado' }), 500);
  });

  return app;
}
