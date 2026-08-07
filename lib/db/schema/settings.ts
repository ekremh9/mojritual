import { jsonb, pgTable, text } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  kljuc: text('kljuc').primaryKey(),
  vrijednost: jsonb('vrijednost').notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
