import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { brandUsers } from './users';

export const brandStatusEnum = pgEnum('brand_status', [
  'na_cekanju',
  'odobren',
  'suspendovan',
]);

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  naziv: text('naziv').notNull(),
  kratkiOpis: text('kratki_opis'),
  prica: text('prica'),
  logoUrl: text('logo_url'),
  coverUrl: text('cover_url'),
  web: text('web'),
  email: text('email'),
  telefon: text('telefon'),
  jib: text('jib'),
  pdvBroj: text('pdv_broj'),
  adresa: text('adresa'),
  status: brandStatusEnum('status').notNull().default('na_cekanju'),
  verifikovan: boolean('verifikovan').notNull().default(false),
  provizijaMpPosto: numeric('provizija_mp_posto', { precision: 5, scale: 2 })
    .notNull()
    .default('20.00'),
  provizijaVpPosto: numeric('provizija_vp_posto', { precision: 5, scale: 2 })
    .notNull()
    .default('20.00'),
  pragBesplatneDostave: integer('prag_besplatne_dostave'),
  cijenaDostave: integer('cijena_dostave').notNull().default(0),
  naknadaPrisustvoMjesecno: integer('naknada_prisustvo_mjesecno').notNull().default(0),
  naknadaStepenVelicina: integer('naknada_stepen_velicina').notNull().default(50),
  naknadaAktivnaOd: date('naknada_aktivna_od'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const brandCertificates = pgTable(
  'brand_certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    naziv: text('naziv').notNull(),
    opis: text('opis'),
    dokumentUrl: text('dokument_url'),
    redoslijed: integer('redoslijed').notNull().default(0),
  },
  (table) => [index('brand_certificates_brand_id_idx').on(table.brandId)],
);

export const brandsRelations = relations(brands, ({ many }) => ({
  brandCertificates: many(brandCertificates),
  brandUsers: many(brandUsers),
}));

export const brandCertificatesRelations = relations(brandCertificates, ({ one }) => ({
  brands: one(brands, {
    fields: [brandCertificates.brandId],
    references: [brands.id],
  }),
}));

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export type BrandCertificate = typeof brandCertificates.$inferSelect;
export type NewBrandCertificate = typeof brandCertificates.$inferInsert;
