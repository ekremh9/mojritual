import { index, integer, numeric, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { products } from './products';

/**
 * Veleprodajni pragovi po proizvodu (Tok A — količinski pragovi, docs/schema.md
 * §4). Partner definiše do 3 nivoa po proizvodu, opciono — 0 do 3 reda po
 * `productId`. Gornja granica od 3 reda NIJE izraziva kao DB constraint
 * (zahtijevala bi COUNT preko postojećih redova), pa se provjerava u server
 * action-u koji piše ovu tabelu (budući zadatak — ova šema samo priprema
 * teren).
 *
 * `popustPosto` je procenat popusta na `products.cijena`, NE apsolutna
 * cijena po komadu — stvarna cijena za prag se RAČUNA u trenutku
 * prikaza/narudžbe (`products.cijena * (1 - popustPosto/100)`, zaokruženo
 * na cijeli fening), ne čuva se kao polje ovdje. To izračunavanje je van
 * obima ovog zadatka (samo šema).
 */
export const wholesalePriceTiers = pgTable(
  'wholesale_price_tiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    minKolicina: integer('min_kolicina').notNull(),
    popustPosto: numeric('popust_posto', { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
