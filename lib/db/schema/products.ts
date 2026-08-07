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
import { categories } from './categories';
import { users } from './users';

export const productFormaEnum = pgEnum('product_forma', [
  'kapsula',
  'tableta',
  'prah',
  'tecnost',
  'gel',
  'krema',
  'zvakaca',
]);

export const productDostupnostEnum = pgEnum('product_dostupnost', [
  'dostupno',
  'nedostupno',
  'uskoro',
]);

export const productStatusEnum = pgEnum('product_status', [
  'nacrt',
  'na_cekanju',
  'odobren',
  'odbijen',
]);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    naziv: text('naziv').notNull(),
    kratkiOpis: text('kratki_opis'),
    opis: text('opis'),
    forma: productFormaEnum('forma').notNull(),
    sastojci: text('sastojci'),
    doziranje: text('doziranje'),
    upozorenja: text('upozorenja'),
    cijena: integer('cijena').notNull(),
    staraCijena: integer('stara_cijena'),
    dostupnost: productDostupnostEnum('dostupnost').notNull().default('dostupno'),
    status: productStatusEnum('status').notNull().default('nacrt'),
    razlogOdbijanja: text('razlog_odbijanja'),
    odobrioUserId: uuid('odobrio_user_id').references(() => users.id, { onDelete: 'set null' }),
    odobrenoAt: timestamp('odobreno_at', { withTimezone: true }),
    oznake: text('oznake').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_brand_id_idx').on(table.brandId),
    index('products_odobrio_user_id_idx').on(table.odobrioUserId),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt'),
    redoslijed: integer('redoslijed').notNull().default(0),
  },
  (table) => [index('product_images_product_id_idx').on(table.productId)],
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.categoryId] }),
    index('product_categories_product_id_idx').on(table.productId),
    index('product_categories_category_id_idx').on(table.categoryId),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
