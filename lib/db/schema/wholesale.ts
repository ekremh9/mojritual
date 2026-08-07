import { index, integer, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { products } from './products';

export const wholesalePriceTiers = pgTable(
  'wholesale_price_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    minKolicina: integer('min_kolicina').notNull(),
    cijena: integer('cijena').notNull(),
  },
  (table) => [
    index('wholesale_price_tiers_product_id_idx').on(table.productId),
    unique('wholesale_price_tiers_product_id_min_kolicina_unique').on(
      table.productId,
      table.minKolicina,
    ),
  ],
);

export type WholesalePriceTier = typeof wholesalePriceTiers.$inferSelect;
export type NewWholesalePriceTier = typeof wholesalePriceTiers.$inferInsert;
