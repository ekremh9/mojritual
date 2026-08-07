import { type AnyPgColumn, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    naziv: text('naziv').notNull(),
    opis: text('opis'),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    ikona: text('ikona'),
    redoslijed: integer('redoslijed').notNull().default(0),
  },
  (table) => [index('categories_parent_id_idx').on(table.parentId)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
