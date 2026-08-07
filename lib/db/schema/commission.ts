import { date, index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { brands } from './brands';

export const commissionPeriodStatusEnum = pgEnum('commission_period_status', [
  'nacrt',
  'poslano',
  'placeno',
  'sporno',
]);

export const commissionPeriods = pgTable(
  'commission_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    periodOd: date('period_od').notNull(),
    periodDo: date('period_do').notNull(),
    iznosPrometa: integer('iznos_prometa').notNull(),
    iznosProvizije: integer('iznos_provizije').notNull(),
    iznosNaknade: integer('iznos_naknade').notNull(),
    ukupnoZaNaplatu: integer('ukupno_za_naplatu').notNull(),
    status: commissionPeriodStatusEnum('status').notNull().default('nacrt'),
    fakturaBroj: text('faktura_broj'),
    placenoAt: timestamp('placeno_at', { withTimezone: true }),
  },
  (table) => [
    unique('commission_periods_brand_period_unique').on(
      table.brandId,
      table.periodOd,
      table.periodDo,
    ),
    index('commission_periods_brand_id_idx').on(table.brandId),
    index('commission_periods_status_idx').on(table.status),
  ],
);

export type CommissionPeriod = typeof commissionPeriods.$inferSelect;
export type NewCommissionPeriod = typeof commissionPeriods.$inferInsert;
