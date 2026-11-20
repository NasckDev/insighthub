import { ID_PATTERN, isAbortError, responseFiltersSchema, type InsightProvider } from '@insighthub/core';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { HttpError, parseInput } from '../http/envelope';
import { logger } from '../logger';
import type { SurveyRepository } from '../repositories/survey-repository';

const bodySchema = z.object({
  filters: responseFiltersSchema.default({}),
  focus: z.enum(['overview', 'problems', 'strengths', 'opportunities']).default('overview'),
});
/** An empty body means "no filters"; a body that is not valid JSON is a client error, not a default. */
async function readJsonBody(request: Request): Promise<unknown> {
  const raw = await request.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'O corpo da requisição não é um JSON válido');
  }
}

const idSchema = z.string().regex(ID_PATTERN);

export function synthesisRoutes(repo: SurveyRepository, provider: InsightProvider) {
  const app = new Hono();

  app.post('/:id/synthesis', async (c) => {
    const survey = await repo.getSurvey(parseInput(idSchema, c.req.param('id')));
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Pesquisa não encontrada');
    const { filters, focus } = parseInput(bodySchema, await readJsonBody(c.req.raw));
    const [{ items: responses, truncated }, surveyTotal] = await Promise.all([
      repo.findResponses(survey.id, filters),
      repo.countResponses(survey.id),
    ]);

    return streamSSE(c, async (stream) => {
      const controller = new AbortController();
      stream.onAbort(() => controller.abort());
      c.req.raw.signal.addEventListener('abort', () => controller.abort(), { once: true });
      try {
        for await (const event of provider.stream({ survey, responses, focus, surveyTotal, truncated }, controller.signal)) {
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
