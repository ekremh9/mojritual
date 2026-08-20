import { index, integer, numeric, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { brands } from './brands';

/**
 * Podrazumijevani veleprodajni pragovi na nivou partnera (brenda) — do 3
 * nivoa, ista forma kao `wholesale_price_tiers` (po proizvodu). Ovo je
 * SAMO prečica za popunjavanje forme proizvoda ("Primijeni podrazumijevane
 * pragove" dugme) — izvor istine za stvarnu narudžbu ostaje isključivo
 * `wholesale_price_tiers` na proizvodu, ova tabela se nikad ne čita pri
 * obračunu cijene.
 */
export const brandWholesaleDefaults = pgTable(
  'brand_wholesale_defaults',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    minKolicina: integer('min_kolicina').notNull(),
    popustPosto: numeric('popust_posto', { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('brand_wholesale_defaults_brand_id_idx').on(table.brandId),
    unique('brand_wholesale_defaults_brand_id_min_kolicina_unique').on(
      table.brandId,
      table.minKolicina,
    ),
  ],
);

export type BrandWholesaleDefault = typeof brandWholesaleDefaults.$inferSelect;
export type NewBrandWholesaleDefault = typeof brandWholesaleDefaults.$inferInsert;
