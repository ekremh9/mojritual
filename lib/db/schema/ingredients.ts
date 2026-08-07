import { index, numeric, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { products } from './products';

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  naziv: text('naziv').notNull(),
  opis: text('opis'),
});

export const productIngredients = pgTable(
  'product_ingredients',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict' }),
    kolicina: numeric('kolicina', { precision: 10, scale: 2 }),
    jedinica: text('jedinica'),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.ingredientId] }),
    index('product_ingredients_product_id_idx').on(table.productId),
    index('product_ingredients_ingredient_id_idx').on(table.ingredientId),
  ],
);

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type ProductIngredient = typeof productIngredients.$inferSelect;
export type NewProductIngredient = typeof productIngredients.$inferInsert;
