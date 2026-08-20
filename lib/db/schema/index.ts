import { relations } from 'drizzle-orm';
import { brandCertificates, brands } from './brands';
import { bundleItems, bundles } from './bundles';
import { categories } from './categories';
import { commissionPeriods } from './commission';
import { medicalReviewers, posts } from './content';
import { emailVerificationTokens } from './email-verification';
import { featuringPricePlans } from './featuring-plans';
import { goals, guideExplanationTemplates, guideSessions, productGoals } from './guide';
import { guideOptionTemplates } from './guide-options';
import { ingredients, productIngredients } from './ingredients';
import { notifications } from './notifications';
import { orderItems, orderShipments, orders } from './orders';
import { productCategories, productImages, products } from './products';
import { productGoalProposals } from './product-goal-proposals';
import { productReviews } from './reviews';
import { supportTickets, ticketMessages } from './support';
import { brandUsers, businessAccounts, users } from './users';
import { wholesalePriceTiers } from './wholesale';

export * from './brands';
export * from './bundles';
export * from './categories';
export * from './commission';
export * from './content';
export * from './email-verification';
export * from './featuring-plans';
export * from './guide';
export * from './guide-options';
export * from './ingredients';
export * from './leads';
export * from './notifications';
export * from './orders';
export * from './products';
export * from './product-goal-proposals';
export * from './reviews';
export * from './settings';
export * from './support';
export * from './users';
export * from './wholesale';

export const usersRelations = relations(users, ({ many }) => ({
  brandUsers: many(brandUsers),
  businessAccounts: many(businessAccounts, { relationName: 'businessAccountOwner' }),
  approvedBusinessAccounts: many(businessAccounts, {
    relationName: 'businessAccountApprover',
  }),
  approvedProducts: many(products),
  orders: many(orders),
  guideSessions: many(guideSessions),
  ticketMessages: many(ticketMessages),
  emailVerificationTokens: many(emailVerificationTokens),
  notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
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

export const businessAccountsRelations = relations(businessAccounts, ({ one, many }) => ({
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
  orders: many(orders),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  brandUsers: many(brandUsers),
  certificates: many(brandCertificates),
  products: many(products),
  bundles: many(bundles),
  orderShipments: many(orderShipments),
  commissionPeriods: many(commissionPeriods),
  supportTickets: many(supportTickets),
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
  istaknutPlan: one(featuringPricePlans, {
    fields: [products.istaknutPlanId],
    references: [featuringPricePlans.id],
  }),
  images: many(productImages),
  productCategories: many(productCategories),
  productIngredients: many(productIngredients),
  wholesaleTiers: many(wholesalePriceTiers),
  bundleItems: many(bundleItems),
  orderItems: many(orderItems),
  productGoals: many(productGoals),
  goalProposals: many(productGoalProposals),
  reviews: many(productReviews),
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

export const bundlesRelations = relations(bundles, ({ one, many }) => ({
  brand: one(brands, {
    fields: [bundles.brandId],
    references: [brands.id],
  }),
  items: many(bundleItems),
  orderItems: many(orderItems),
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleItems.bundleId],
    references: [bundles.id],
  }),
  product: one(products, {
    fields: [bundleItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  businessAccount: one(businessAccounts, {
    fields: [orders.businessAccountId],
    references: [businessAccounts.id],
  }),
  shipments: many(orderShipments),
  supportTickets: many(supportTickets),
}));

export const orderShipmentsRelations = relations(orderShipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderShipments.orderId],
    references: [orders.id],
  }),
  brand: one(brands, {
    fields: [orderShipments.brandId],
    references: [brands.id],
  }),
  items: many(orderItems),
  supportTickets: many(supportTickets),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  shipment: one(orderShipments, {
    fields: [orderItems.shipmentId],
    references: [orderShipments.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  bundle: one(bundles, {
    fields: [orderItems.bundleId],
    references: [bundles.id],
  }),
  review: one(productReviews, {
    fields: [orderItems.id],
    references: [productReviews.orderItemId],
  }),
}));

export const commissionPeriodsRelations = relations(commissionPeriods, ({ one }) => ({
  brand: one(brands, {
    fields: [commissionPeriods.brandId],
    references: [brands.id],
  }),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  productGoals: many(productGoals),
  goalProposals: many(productGoalProposals),
  explanationTemplates: many(guideExplanationTemplates),
  optionTemplates: many(guideOptionTemplates),
}));

export const productGoalsRelations = relations(productGoals, ({ one }) => ({
  product: one(products, {
    fields: [productGoals.productId],
    references: [products.id],
  }),
  goal: one(goals, {
    fields: [productGoals.goalId],
    references: [goals.id],
  }),
}));

export const productGoalProposalsRelations = relations(productGoalProposals, ({ one }) => ({
  product: one(products, {
    fields: [productGoalProposals.productId],
    references: [products.id],
  }),
  goal: one(goals, {
    fields: [productGoalProposals.goalId],
    references: [goals.id],
  }),
}));

export const guideExplanationTemplatesRelations = relations(
  guideExplanationTemplates,
  ({ one }) => ({
    goal: one(goals, {
      fields: [guideExplanationTemplates.goalId],
      references: [goals.id],
    }),
  }),
);

export const guideOptionTemplatesRelations = relations(guideOptionTemplates, ({ one }) => ({
  goal: one(goals, {
    fields: [guideOptionTemplates.goalId],
    references: [goals.id],
  }),
}));

export const guideSessionsRelations = relations(guideSessions, ({ one }) => ({
  user: one(users, {
    fields: [guideSessions.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  order: one(orders, {
    fields: [supportTickets.orderId],
    references: [orders.id],
  }),
  shipment: one(orderShipments, {
    fields: [supportTickets.shipmentId],
    references: [orderShipments.id],
  }),
  brand: one(brands, {
    fields: [supportTickets.brandId],
    references: [brands.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
  autorUser: one(users, {
    fields: [ticketMessages.autorUserId],
    references: [users.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  orderItem: one(orderItems, {
    fields: [productReviews.orderItemId],
    references: [orderItems.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  recenzent: one(medicalReviewers, {
    fields: [posts.recenzentId],
    references: [medicalReviewers.id],
  }),
}));

export const medicalReviewersRelations = relations(medicalReviewers, ({ many }) => ({
  posts: many(posts),
}));
