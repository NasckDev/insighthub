import { isAbortError, responseFiltersSchema, type InsightProvider } from '@insighthub/core';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { HttpError, parseInput } from '../http/envelope';
import { logger } from '../logger';
import type { SurveyRepository } from '../repositories/survey-repository';

const bodySchema = z.object({ filters: responseFiltersSchema.default({}) });
const idSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);

export function synthesisRoutes(repo: SurveyRepository, provider: InsightProvider) {
  const app = new Hono();

  app.post('/:id/synthesis', async (c) => {
    const survey = await repo.getSurvey(parseInput(idSchema, c.req.param('id')));
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Pesquisa não encontrada');
    const body: unknown = await c.req.json().catch(() => ({}));
    const { filters } = parseInput(bodySchema, body);
    const responses = await repo.findResponses(survey.id, filters);

    return streamSSE(c, async (stream) => {
      const controller = new AbortController();
      stream.onAbort(() => controller.abort());
      c.req.raw.signal.addEventListener('abort', () => controller.abort(), { once: true });
      try {
        for await (const event of provider.stream({ survey, responses }, controller.signal)) {
          await stream.writeSSE({ event: event.type, data: JSON.stringify(event) });
        }
      } catch (error: unknown) {
        if (isAbortError(error) || controller.signal.aborted) return;
        logger.error('Synthesis stream failed', error);
        const message = 'Falha ao gerar a síntese. Tente novamente.';
        await stream.writeSSE({ event: 'error', data: JSON.stringify({ type: 'error', message }) });
      }
    });
  });

  return app;
}
