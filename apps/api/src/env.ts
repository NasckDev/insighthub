import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65_535).default(3333),
  DATABASE_URL: z.string().min(1).default('file:./insighthub.db'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((raw) =>
      raw
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(120),
  SYNTHESIS_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(10),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-opus-5-5'),
  INSIGHTHUB_API_TOKEN: z.string().min(16, 'use pelo menos 16 caracteres').optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  const env = parsed.data;
  if (env.ANTHROPIC_API_KEY && !env.INSIGHTHUB_API_TOKEN) {
    throw new Error(
      'INSIGHTHUB_API_TOKEN is required when ANTHROPIC_API_KEY is set: without it anyone could trigger paid calls',
    );
  }
  return env;
}
