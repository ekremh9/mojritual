import { relations } from 'drizzle-orm';
import { brandCertificates, brands } from './brands';
import { categories } from './categories';
import { ingredients, productIngredients } from './ingredients';
import { productCategories, productImages, products } from './products';
import { brandUsers, businessAccounts, users } from './users';
import { wholesalePriceTiers } from './wholesale';

export * from './brands';
export * from './categories';
export * from './ingredients';
export * from './products';
export * from './users';
export * from './wholesale';

export const usersRelations = relations(users, ({ many }) => ({
  brandUsers: many(brandUsers),
  businessAccounts: many(businessAccounts, { relationName: 'businessAccountOwner' }),
  approvedBusinessAccounts: many(businessAccounts, {
    relationName: 'businessAccountApprover',
  }),
  approvedProducts: many(products),
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
  products: many(products),
}));

export const brandCertificatesRelations = relations(brandCertificates, ({ one }) => ({
  brand: one(brands, {
    fields: [brandCertificates.brandId],
    references: [brands.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryParent',
  }),
  children: many(categories, { relationName: 'categoryParent' }),
  productCategories: many(productCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  odobrioUser: one(users, {
    fields: [products.odobrioUserId],
    references: [users.id],
  }),
  images: many(productImages),
  productCategories: many(productCategories),
  productIngredients: many(productIngredients),
  wholesaleTiers: many(wholesalePriceTiers),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  productIngredients: many(productIngredients),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [productIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const wholesalePriceTiersRelations = relations(wholesalePriceTiers, ({ one }) => ({
  product: one(products, {
    fields: [wholesalePriceTiers.productId],
    references: [products.id],
  }),
}));
