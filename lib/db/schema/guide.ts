import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { users } from './users';

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  naziv: text('naziv').notNull(),
  opis: text('opis'),
});

// primarni = glavni razlog da se proizvod pojavi u toj grupi preporuka.
// sekundarni = koristan dodatak, ne nosilac preporuke.
export const productGoalOznakaEnum = pgEnum('product_goal_oznaka', [
  'primarni',
  'sekundarni',
]);

export const productGoals = pgTable(
  'product_goals',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    // Postavlja admin ili medicinski recenzent. NIKAD brend — vidi CLAUDE.md pravilo 2.
    relevantnost: integer('relevantnost').notNull(),
    // Postavlja admin ili medicinski recenzent. NIKAD brend — vidi CLAUDE.md pravilo 2.
    oznaka: productGoalOznakaEnum('oznaka').notNull().default('sekundarni'),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.goalId] }),
    index('product_goals_product_id_idx').on(table.productId),
    index('product_goals_goal_id_idx').on(table.goalId),
  ],
);

// Statični tekst objašnjenja prikazan uz preporuke za dati cilj u Ritual
// Vodiču. Za sada JEDAN aktivan tekst po cilju, ne više varijanti —
// prošireno kasnije ako zatreba.
export const guideExplanationTemplates = pgTable(
  'guide_explanation_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    tekst: text('tekst').notNull(),
    aktivan: boolean('aktivan').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('guide_explanation_templates_goal_id_idx').on(table.goalId)],
);

export const guideSessions = pgTable(
  'guide_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    anonId: text('anon_id'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    odgovori: jsonb('odgovori').notNull(),
    rezultat: jsonb('rezultat'),
    sacuvano: boolean('sacuvano').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('guide_sessions_user_id_idx').on(table.userId),
    index('guide_sessions_anon_id_idx').on(table.anonId),
  ],
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type ProductGoal = typeof productGoals.$inferSelect;
export type NewProductGoal = typeof productGoals.$inferInsert;

export type GuideSession = typeof guideSessions.$inferSelect;
export type NewGuideSession = typeof guideSessions.$inferInsert;

export type GuideExplanationTemplate = typeof guideExplanationTemplates.$inferSelect;
export type NewGuideExplanationTemplate = typeof guideExplanationTemplates.$inferInsert;
