import {
  computeNps,
  npsRange,
  type Page,
  type Pagination,
  type ResponseFilters,
  type Survey,
  type SurveyResponse,
  type SurveySummary,
} from '@insighthub/core';
import { and, asc, between, count, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../db/client';
import { responses, surveys } from '../db/schema';

/** Upper bound of rows loaded in memory for aggregation and synthesis. */
export const MAX_ANALYSIS_ROWS = 5_000;

function buildWhere(surveyId: string, filters: ResponseFilters): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(responses.surveyId, surveyId)];
  if (filters.plan?.length) conditions.push(inArray(responses.plan, filters.plan));
  if (filters.region?.length) conditions.push(inArray(responses.region, filters.region));
  if (filters.role?.length) conditions.push(inArray(responses.role, filters.role));
  if (filters.nps) {
    const [min, max] = npsRange(filters.nps);
    conditions.push(between(responses.npsScore, min, max));
  }
  if (filters.q) {
    // Parameterized, and instr() avoids LIKE wildcard injection.
    conditions.push(sql`instr(lower(${responses.comment}), lower(${filters.q})) > 0`);
  }
  return and(...conditions);
}

export function createSurveyRepository(db: Database) {
  return {
    async listSurveys(): Promise<SurveySummary[]> {
      const rows = await db.select().from(surveys).orderBy(asc(surveys.createdAt));
      const scores = await db
        .select({ surveyId: responses.surveyId, score: responses.npsScore })
        .from(responses);
      return rows.map(({ questions: _questions, ...survey }) => {
        const own = scores.filter((s) => s.surveyId === survey.id).map((s) => s.score);
        return { ...survey, responseCount: own.length, nps: own.length ? computeNps(own).nps : null };
      });
    },

    async getSurvey(id: string): Promise<Survey | undefined> {
      const [row] = await db.select().from(surveys).where(eq(surveys.id, id)).limit(1);
      return row;
    },

    async listResponses(
      surveyId: string,
      filters: ResponseFilters,
      { page, pageSize }: Pagination,
    ): Promise<Page<SurveyResponse>> {
      const where = buildWhere(surveyId, filters);
      const [totalRow] = await db.select({ total: count() }).from(responses).where(where);
      const items = await db
        .select()
        .from(responses)
        .where(where)
        .orderBy(asc(responses.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      const total = totalRow?.total ?? 0;
      return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
    },

    async getResponse(surveyId: string, responseId: string): Promise<SurveyResponse | undefined> {
      const [row] = await db
        .select()
        .from(responses)
        .where(and(eq(responses.surveyId, surveyId), eq(responses.id, responseId)))
        .limit(1);
      return row;
    },

    async findResponses(surveyId: string, filters: ResponseFilters): Promise<SurveyResponse[]> {
      return db
        .select()
        .from(responses)
        .where(buildWhere(surveyId, filters))
        .orderBy(asc(responses.id))
        .limit(MAX_ANALYSIS_ROWS);
    },
  };
}

export type SurveyRepository = ReturnType<typeof createSurveyRepository>;
