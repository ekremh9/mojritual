import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationTipEnum = pgEnum('notification_tip', [
  'narudzba_status',
  'proizvod_odobren',
  'proizvod_odbijen',
  'brend_odobren',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tip: notificationTipEnum('tip').notNull(),
    naslov: text('naslov').notNull(),
    sadrzaj: text('sadrzaj').notNull(),
    link: text('link'),
    procitano: boolean('procitano').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_user_id_procitano_idx').on(table.userId, table.procitano),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
