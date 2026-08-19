import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { goals } from './guide';

/**
 * Opcije za korak 3 Ritual Vodiča (dodatno pitanje po cilju) — do 5 po
 * cilju, uređive kroz admin. Svaka opcija može imati SVOJ tekst objašnjenja
 * (`tekstObjasnjenja`), nezavisno od `guide_explanation_templates` (tekst na
 * nivou cilja) — oba mehanizma postoje paralelno, admin/biznis strana bira
 * koji se koristi. Ne miješati sa `guideExplanationTemplates`.
 */
export const guideOptionTemplates = pgTable(
  'guide_option_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    tekstOpcije: text('tekst_opcije').notNull(),
    // Nullable — admin možda još nije popunio objašnjenje specifično za ovu
    // opciju; guide_explanation_templates ostaje kao fallback na nivou cilja.
    tekstObjasnjenja: text('tekst_objasnjenja'),
    redoslijed: integer('redoslijed').notNull().default(0),
    aktivan: boolean('aktivan').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('guide_option_templates_goal_id_idx').on(table.goalId)],
);

export type GuideOptionTemplate = typeof guideOptionTemplates.$inferSelect;
export type NewGuideOptionTemplate = typeof guideOptionTemplates.$inferInsert;
