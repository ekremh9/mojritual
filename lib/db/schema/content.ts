import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const postStatusEnum = pgEnum('post_status', ['nacrt', 'objavljeno']);

export const medicalReviewers = pgTable('medical_reviewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  ime: text('ime').notNull(),
  titula: text('titula'),
  specijalnost: text('specijalnost'),
  biografija: text('biografija'),
  fotoUrl: text('foto_url'),
  aktivan: boolean('aktivan').notNull().default(true),
});

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    naslov: text('naslov').notNull(),
    sazetak: text('sazetak'),
    sadrzaj: text('sadrzaj').notNull(),
    coverUrl: text('cover_url'),
    autor: text('autor'),
    recenzentId: uuid('recenzent_id').references(() => medicalReviewers.id, {
      onDelete: 'set null',
    }),
    status: postStatusEnum('status').notNull().default('nacrt'),
    objavljenoAt: timestamp('objavljeno_at', { withTimezone: true }),
  },
  (table) => [
    index('posts_slug_idx').on(table.slug),
    index('posts_status_idx').on(table.status),
  ],
);

export type MedicalReviewer = typeof medicalReviewers.$inferSelect;
export type NewMedicalReviewer = typeof medicalReviewers.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
