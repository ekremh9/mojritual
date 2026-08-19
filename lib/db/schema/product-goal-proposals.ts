import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { goals } from './guide';
import { products } from './products';

/**
 * Partner (brend) predlaže cilj za svoj proizvod — BEZ relevantnosti ili
 * oznake, to ostaje isključivo odluka admina/medicinskog recenzenta kroz
 * `product_goals` (CLAUDE.md pravilo 2, schema.md §8: "Relevantnost
 * postavlja admin ili medicinski recenzent — ne brend").
 *
 * Namjerno ODVOJENA tabela, ne kolona na `product_goals` — ovako partner
 * fizički ne može upisati (čak ni sa default vrijednostima poput
 * relevantnost=50) red koji Ritual Vodič direktno čita za rangiranje
 * (`computeGuideResultAction` čita isključivo `product_goals`). Jedini kod
 * koji piše u `product_goals` ostaje `setProductGoalAction`
 * (admin-guide-actions.ts).
 *
 * Kad recenzent kroz `setProductGoalAction` kreira stvarnu vezu za ovaj
 * (productId, goalId) par, odgovarajući red ovdje se briše — to je
 * "preuzimanje" prijedloga, signal adminu u UI da nestane.
 */
export const productGoalProposals = pgTable(
  'product_goal_proposals',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.goalId] }),
    index('product_goal_proposals_product_id_idx').on(table.productId),
    index('product_goal_proposals_goal_id_idx').on(table.goalId),
  ],
);

export type ProductGoalProposal = typeof productGoalProposals.$inferSelect;
export type NewProductGoalProposal = typeof productGoalProposals.$inferInsert;
