import {
  compareSegments,
  computeNps,
  dimensionSchema,
  ID_PATTERN,
  paginationSchema,
  responseFiltersQuerySchema,
} from '@insighthub/core';
import { Hono } from 'hono';
import { z } from 'zod';
import { HttpError, ok, parseInput } from '../http/envelope';
import type { SurveyRepository } from '../repositories/survey-repository';

const idSchema = z.string().regex(ID_PATTERN, 'id inválido');

export function surveyRoutes(repo: SurveyRepository) {
  const app = new Hono();

  async function requireSurvey(rawId: string) {
    const survey = await repo.getSurvey(parseInput(idSchema, rawId));
    if (!survey) throw new HttpError(404, 'NOT_FOUND', 'Pesquisa não encontrada');
    return survey;
  }

  app.get('/', async (c) => c.json(ok(await repo.listSurveys())));

  app.get('/:id', async (c) => c.json(ok(await requireSurvey(c.req.param('id')))));

  app.get('/:id/responses', async (c) => {
    const survey = await requireSurvey(c.req.param('id'));
    const query = c.req.query();
    const filters = parseInput(responseFiltersQuerySchema, query);
    const pagination = parseInput(paginationSchema, query);
    const { items, ...pageMeta } = await repo.listResponses(survey.id, filters, pagination);
    return c.json(ok(items, pageMeta));
  });

  app.get('/:id/responses/:responseId', async (c) => {
    const survey = await requireSurvey(c.req.param('id'));
    const responseId = parseInput(idSchema, c.req.param('responseId'));
    const response = await repo.getResponse(survey.id, responseId);
    if (!response) throw new HttpError(404, 'NOT_FOUND', 'Resposta não encontrada');
    return c.json(ok(response));
  });

  app.get('/:id/compare', async (c) => {
    const survey = await requireSurvey(c.req.param('id'));
    const query = c.req.query();
    const filters = parseInput(responseFiltersQuerySchema, query);
    const dimension = parseInput(dimensionSchema, query.dimension ?? 'plan');
    const { items: rows, truncated } = await repo.findResponses(survey.id, filters);
    const overall = computeNps(rows.map((r) => r.npsScore));
    return c.json(ok({ dimension, overall, segments: compareSegments(rows, dimension) }, { truncated }));
  });

  return app;
}
