import { createClient } from '@libsql/client';
import { generateSeed } from '@insighthub/core';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(url: string) {
  return drizzle(createClient({ url }), { schema });
}

/** Idempotent DDL kept next to the Drizzle schema (no migration tool needed for SQLite dev). */
const DDL = [
  `CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    status TEXT NOT NULL, created_at TEXT NOT NULL, questions TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY, survey_id TEXT NOT NULL REFERENCES surveys(id),
    respondent_id TEXT NOT NULL, plan TEXT NOT NULL, region TEXT NOT NULL, role TEXT NOT NULL,
    nps_score INTEGER NOT NULL CHECK (nps_score BETWEEN 0 AND 10), comment TEXT NOT NULL,
    answers TEXT NOT NULL, submitted_at TEXT NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS responses_survey_idx ON responses (survey_id)',
  'CREATE INDEX IF NOT EXISTS responses_segment_idx ON responses (survey_id, plan, region, role)',
];

const INSERT_BATCH = 200;

export async function ensureSchema(db: Database): Promise<void> {
  for (const statement of DDL) await db.run(statement);
}

/** Seeds the deterministic fictional dataset when the database is empty. Returns rows inserted. */
export async function seedIfEmpty(db: Database): Promise<number> {
  const [row] = await db.select({ total: count() }).from(schema.surveys);
  if ((row?.total ?? 0) > 0) return 0;
  const data = generateSeed();
  await db.insert(schema.surveys).values(data.surveys);
  for (let start = 0; start < data.responses.length; start += INSERT_BATCH) {
    await db.insert(schema.responses).values(data.responses.slice(start, start + INSERT_BATCH));
  }
  return data.responses.length;
}
