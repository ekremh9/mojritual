import { index, integer, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { orderItems } from './orders';
import { products } from './products';

export const productReviewStatusEnum = pgEnum('product_review_status', [
  'na_cekanju',
  'objavljeno',
  'odbijeno',
]);

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    ocjena: integer('ocjena').notNull(),
    komentar: text('komentar'),
    status: productReviewStatusEnum('status').notNull().default('na_cekanju'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_reviews_product_id_idx').on(table.productId),
    unique('product_reviews_order_item_id_unique').on(table.orderItemId),
  ],
);

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
