import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';
import { products } from './products';

export const bundleStatusEnum = pgEnum('bundle_status', [
  'nacrt',
  'na_cekanju',
  'odobren',
  'odbijen',
]);

export const bundles = pgTable(
  'bundles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    naziv: text('naziv').notNull(),
    opis: text('opis'),
    slikaUrl: text('slika_url'),
    cijena: integer('cijena').notNull(),
    status: bundleStatusEnum('status').notNull().default('nacrt'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('bundles_brand_id_idx').on(table.brandId)],
);

export const bundleItems = pgTable(
  'bundle_items',
  {
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    kolicina: integer('kolicina').notNull().default(1),
  },
  (table) => [
    primaryKey({ columns: [table.bundleId, table.productId] }),
    index('bundle_items_bundle_id_idx').on(table.bundleId),
    index('bundle_items_product_id_idx').on(table.productId),
  ],
);

export type Bundle = typeof bundles.$inferSelect;
export type NewBundle = typeof bundles.$inferInsert;

export type BundleItem = typeof bundleItems.$inferSelect;
export type NewBundleItem = typeof bundleItems.$inferInsert;
