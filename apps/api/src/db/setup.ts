import { loadEnv } from '../env';
import { logger } from '../logger';
import { createDatabase, ensureSchema, seedIfEmpty } from './client';

const env = loadEnv();
const db = createDatabase(env.DATABASE_URL);

try {
  await ensureSchema(db);
  const inserted = await seedIfEmpty(db);
  logger.info(inserted > 0 ? `Seeded ${inserted} fictional responses` : 'Database already seeded');
} catch (error: unknown) {
  logger.error('Database setup failed', error);
  process.exitCode = 1;
}
