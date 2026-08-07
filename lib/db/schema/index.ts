import { relations } from 'drizzle-orm';
import { brandCertificates, brands } from './brands';
import { brandUsers, businessAccounts, users } from './users';

export * from './brands';
export * from './users';

export const usersRelations = relations(users, ({ many }) => ({
  brandUsers: many(brandUsers),
  businessAccounts: many(businessAccounts, { relationName: 'businessAccountOwner' }),
  approvedBusinessAccounts: many(businessAccounts, {
    relationName: 'businessAccountApprover',
  }),
}));

export const brandUsersRelations = relations(brandUsers, ({ one }) => ({
  user: one(users, {
    fields: [brandUsers.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [brandUsers.brandId],
    references: [brands.id],
  }),
}));

export const businessAccountsRelations = relations(businessAccounts, ({ one }) => ({
  user: one(users, {
    fields: [businessAccounts.userId],
    references: [users.id],
    relationName: 'businessAccountOwner',
  }),
  odobrioUser: one(users, {
    fields: [businessAccounts.odobrioUserId],
    references: [users.id],
    relationName: 'businessAccountApprover',
  }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  brandUsers: many(brandUsers),
  certificates: many(brandCertificates),
}));

export const brandCertificatesRelations = relations(brandCertificates, ({ one }) => ({
  brand: one(brands, {
    fields: [brandCertificates.brandId],
    references: [brands.id],
  }),
}));
