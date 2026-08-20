import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const featuringTipEnum = pgEnum('featuring_tip', ['proizvod', 'brend']);

/**
 * Admin-uređivani cjenovnik paketa isticanja — trajanje i cijena, zasebno
 * za proizvode i partnere (`tip`). Samostalna referentna tabela, bez FK:
 * ovaj zadatak samo administrira pakete, NE povezuje ih sa stvarnim
 * zahtjevom za isticanje (`products.istaknutStatus` / `brands.istaknut`) —
 * to je sljedeći, poseban korak.
 *
 * `ponavljajuce` za sada samo bilježi namjeru da se paket automatski
 * produžuje — stvarna automatska naplata/produženje NIJE implementirana.
 */
export const featuringPricePlans = pgTable(
  'featuring_price_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tip: featuringTipEnum('tip').notNull(),
    naziv: text('naziv').notNull(),
    trajanjeDana: integer('trajanje_dana').notNull(),
    cijena: integer('cijena').notNull(),
    ponavljajuce: boolean('ponavljajuce').notNull().default(false),
    aktivan: boolean('aktivan').notNull().default(true),
    redoslijed: integer('redoslijed').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('featuring_price_plans_tip_idx').on(table.tip),
    index('featuring_price_plans_tip_redoslijed_idx').on(table.tip, table.redoslijed),
  ],
);

export type FeaturingPricePlan = typeof featuringPricePlans.$inferSelect;
export type NewFeaturingPricePlan = typeof featuringPricePlans.$inferInsert;
