import {
  computeNps,
  matchesFilters,
  npsRange,
  sortResponses,
  type Page,
  type Pagination,
  type ResponseFilters,
  type ResponseSort,
  type Survey,
  type SurveyResponse,
  type SurveySummary,
} from '@insighthub/core';
import { and, asc, between, count, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { Database } from '../db/client';
import { responses, surveys } from '../db/schema';

/** Upper bound of rows loaded in memory for aggregation, text search and synthesis. */
export const MAX_ANALYSIS_ROWS = 5_000;

/**
 * Filters the database can express exactly. Text search and theme matching are NOT here: SQLite's
 * `lower()` only understands ASCII, so those run in memory with the same core functions the browser
 * demo uses, which keeps both adapters in agreement on accents and whole-word matches.
 */
function buildWhere(surveyId: string, filters: ResponseFilters): SQL | undefined {
  const conditions: (SQL | undefined)[] = [eq(responses.surveyId, surveyId)];
  if (filters.plan?.length) conditions.push(inArray(responses.plan, filters.plan));
  if (filters.region?.length) conditions.push(inArray(responses.region, filters.region));
  if (filters.role?.length) conditions.push(inArray(responses.role, filters.role));
  if (filters.nps) {
    const [min, max] = npsRange(filters.nps);
    conditions.push(between(responses.npsScore, min, max));
  }
  if (filters.from) conditions.push(sql`substr(${responses.submittedAt}, 1, 10) >= ${filters.from}`);
  if (filters.to) conditions.push(sql`substr(${responses.submittedAt}, 1, 10) <= ${filters.to}`);
  return and(...conditions);
}

function needsMemoryFilter(filters: ResponseFilters): boolean {
  return Boolean(filters.q?.trim() || filters.theme);
}

function orderBy(sort: ResponseSort): SQL[] {
  switch (sort) {
    case 'oldest':
      return [asc(responses.submittedAt), asc(responses.id)];
    case 'score-desc':
      return [desc(responses.npsScore), asc(responses.id)];
    case 'score-asc':
      return [asc(responses.npsScore), asc(responses.id)];
    default:
      return [desc(responses.submittedAt), asc(responses.id)];
  }
}

export interface AnalysisRows {
  items: SurveyResponse[];
  /** How many responses match the filters (within the scanned rows). */
  total: number;
  /** True when the survey has more rows than the analysis limit, so `items` is a prefix. */
  truncated: boolean;
}

export function createSurveyRepository(db: Database) {
  async function scan(surveyId: string, filters: ResponseFilters): Promise<AnalysisRows> {
    const rows = await db
      .select()
      .from(responses)
      .where(buildWhere(surveyId, filters))
      .orderBy(asc(responses.id))
      .limit(MAX_ANALYSIS_ROWS + 1);
    const truncated = rows.length > MAX_ANALYSIS_ROWS;
    const scanned = truncated ? rows.slice(0, MAX_ANALYSIS_ROWS) : rows;
    const items = needsMemoryFilter(filters) ? scanned.filter((row) => matchesFilters(row, filters)) : scanned;
    return { items, total: items.length, truncated };
  }

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

    async countResponses(surveyId: string): Promise<number> {
      const [row] = await db.select({ total: count() }).from(responses).where(eq(responses.surveyId, surveyId));
      return row?.total ?? 0;
    },

    async listResponses(
      surveyId: string,
      filters: ResponseFilters,
      { page, pageSize, sort }: Pagination,
    ): Promise<Page<SurveyResponse> & { truncated: boolean }> {
      if (needsMemoryFilter(filters)) {
        const { items, truncated } = await scan(surveyId, filters);
        const ordered = sortResponses(items, sort);
        const total = ordered.length;
        return {
          items: ordered.slice((page - 1) * pageSize, page * pageSize),
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          truncated,
        };
      }
      const where = buildWhere(surveyId, filters);
      const [totalRow] = await db.select({ total: count() }).from(responses).where(where);
      const items = await db
        .select()
        .from(responses)
        .where(where)
        .orderBy(...orderBy(sort))
        .limit(pageSize)
        .offset((page - 1) * pageSize);
      const total = totalRow?.total ?? 0;
      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        truncated: false,
      };
    },

    async getResponse(surveyId: string, responseId: string): Promise<SurveyResponse | undefined> {
      const [row] = await db
        .select()
        .from(responses)
        .where(and(eq(responses.surveyId, surveyId), eq(responses.id, responseId)))
        .limit(1);
      return row;
    },

    /** Rows for aggregation and synthesis, with a flag that says when the 5.000-row cap cut the data. */
    findResponses: scan,
  };
}

export type SurveyRepository = ReturnType<typeof createSurveyRepository>;
