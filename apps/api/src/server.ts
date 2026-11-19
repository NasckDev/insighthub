import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import type { Context } from 'hono';
import { createApp } from './app';
import { createDatabase, ensureSchema, seedIfEmpty } from './db/client';
import { loadEnv } from './env';
import { logger } from './logger';
import { selectProvider } from './providers';
import { createSurveyRepository } from './repositories/survey-repository';

function clientKey(c: Context): string {
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

const env = loadEnv();
const db = createDatabase(env.DATABASE_URL);
await ensureSchema(db);
await seedIfEmpty(db);

const provider = selectProvider(env);
const app = createApp({
  repo: createSurveyRepository(db),
  provider,
  corsOrigins: env.CORS_ORIGINS,
  rateLimitPerMinute: env.RATE_LIMIT_PER_MINUTE,
  synthesisLimitPerMinute: env.SYNTHESIS_LIMIT_PER_MINUTE,
  synthesisToken: env.INSIGHTHUB_API_TOKEN,
  clientKey,
});

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(`InsightHub API listening on http://localhost:${info.port}`, { provider: provider.name });
});

function shutdown(): void {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
