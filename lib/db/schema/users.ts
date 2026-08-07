import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';

export const userRoleEnum = pgEnum('user_role', ['customer', 'brand', 'admin']);

export const brandUserRoleEnum = pgEnum('brand_user_role', ['vlasnik', 'urednik']);

export const businessAccountTypeEnum = pgEnum('business_account_type', [
  'farmaceutska_kuca',
  'medicinska_ustanova',
  'ostalo',
]);

export const businessAccountStatusEnum = pgEnum('business_account_status', [
  'na_cekanju',
  'odobreno',
  'odbijeno',
  'suspendovano',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull(),
  ime: text('ime'),
  telefon: text('telefon'),
  emailVerifikovanAt: timestamp('email_verifikovan_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const brandUsers = pgTable(
  'brand_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    uloga: brandUserRoleEnum('uloga').notNull(),
  },
  (table) => [
    index('brand_users_user_id_idx').on(table.userId),
    index('brand_users_brand_id_idx').on(table.brandId),
    unique().on(table.userId, table.brandId),
  ],
);

export const businessAccounts = pgTable(
  'business_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    naziv: text('naziv').notNull(),
    tip: businessAccountTypeEnum('tip').notNull(),
    jib: text('jib').notNull(),
    pdvBroj: text('pdv_broj'),
    adresa: text('adresa').notNull(),
    grad: text('grad').notNull(),
    postanskiBroj: text('postanski_broj').notNull(),
    kontaktOsoba: text('kontakt_osoba').notNull(),
    kontaktTelefon: text('kontakt_telefon').notNull(),
    status: businessAccountStatusEnum('status').notNull().default('na_cekanju'),
    odobrioUserId: uuid('odobrio_user_id').references(() => users.id, { onDelete: 'set null' }),
    odobrenoAt: timestamp('odobreno_at', { withTimezone: true }),
    napomenaAdmina: text('napomena_admina'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('business_accounts_user_id_idx').on(table.userId),
    index('business_accounts_odobrio_user_id_idx').on(table.odobrioUserId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  brandUsers: many(brandUsers),
  businessAccounts: many(businessAccounts),
}));

export const brandUsersRelations = relations(brandUsers, ({ one }) => ({
  users: one(users, {
    fields: [brandUsers.userId],
    references: [users.id],
  }),
  brands: one(brands, {
    fields: [brandUsers.brandId],
    references: [brands.id],
  }),
}));

export const businessAccountsRelations = relations(businessAccounts, ({ one }) => ({
  users: one(users, {
    fields: [businessAccounts.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type BrandUser = typeof brandUsers.$inferSelect;
export type NewBrandUser = typeof brandUsers.$inferInsert;

export type BusinessAccount = typeof businessAccounts.$inferSelect;
export type NewBusinessAccount = typeof businessAccounts.$inferInsert;
