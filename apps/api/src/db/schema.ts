import type { AnswerValue, Plan, Question, Region, Role, Survey } from '@insighthub/core';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const surveys = sqliteTable('surveys', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').$type<Survey['status']>().notNull(),
  createdAt: text('created_at').notNull(),
  questions: text('questions', { mode: 'json' }).$type<Question[]>().notNull(),
});

export const responses = sqliteTable(
  'responses',
  {
    id: text('id').primaryKey(),
    surveyId: text('survey_id')
      .notNull()
      .references(() => surveys.id),
    respondentId: text('respondent_id').notNull(),
    plan: text('plan').$type<Plan>().notNull(),
    region: text('region').$type<Region>().notNull(),
    role: text('role').$type<Role>().notNull(),
    npsScore: integer('nps_score').notNull(),
    comment: text('comment').notNull(),
    answers: text('answers', { mode: 'json' }).$type<Record<string, AnswerValue>>().notNull(),
    submittedAt: text('submitted_at').notNull(),
  },
  (table) => [
    index('responses_survey_idx').on(table.surveyId),
    index('responses_segment_idx').on(table.surveyId, table.plan, table.region, table.role),
  ],
);
