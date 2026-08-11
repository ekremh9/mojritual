import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgSequence,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';
import { bundles } from './bundles';
import { products } from './products';
import { businessAccounts, users } from './users';

/**
 * Izvor broja narudžbe (`MR-2026-00421`). `nextval()` je atoman na nivou
 * baze — dvije istovremene narudžbe nikad ne mogu dobiti isti broj, bez
 * eksplicitnog zaključavanja (za razliku od SELECT FOR UPDATE nad brojačem
 * u `settings`, koje bi pod konkurentnim narudžbama moglo dovesti do
 * čekanja ili deadlock-a). Cijena: broj nije bez rupa — narudžba čija
 * transakcija padne u rollback ostavlja preskočen broj. To je prihvatljivo,
 * jedinstvenost je jedino što je bitno.
 *
 * Sekvenca se nikad ne resetuje po godini — godina u broju je snapshot
 * trenutka narudžbe, ne dio brojača.
 */
export const orderBrojSequence = pgSequence('order_broj_seq', {
  startWith: 1,
  increment: 1,
  minValue: 1,
});

export const orderTipEnum = pgEnum('order_tip', ['maloprodaja', 'veleprodaja']);

export const orderNacinPlacanjaEnum = pgEnum('order_nacin_placanja', ['pouzece']);

export const orderStatusEnum = pgEnum('order_status', [
  'na_cekanju',
  'potvrdjeno',
  'djelimicno_poslano',
  'poslano',
  'isporuceno',
  'otkazano',
]);

export const orderShipmentStatusEnum = pgEnum('order_shipment_status', [
  'novo',
  'potvrdjeno',
  'poslano',
  'isporuceno',
  'otkazano',
  'vraceno',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broj: text('broj').notNull().unique(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    businessAccountId: uuid('business_account_id').references(() => businessAccounts.id, {
      onDelete: 'set null',
    }),
    tip: orderTipEnum('tip').notNull(),
    kupacIme: text('kupac_ime').notNull(),
    kupacEmail: text('kupac_email').notNull(),
    kupacTelefon: text('kupac_telefon').notNull(),
    adresa: text('adresa').notNull(),
    grad: text('grad').notNull(),
    postanskiBroj: text('postanski_broj').notNull(),
    napomena: text('napomena'),
    iznosStavki: integer('iznos_stavki').notNull(),
    iznosDostave: integer('iznos_dostave').notNull(),
    ukupno: integer('ukupno').notNull(),
    nacinPlacanja: orderNacinPlacanjaEnum('nacin_placanja').notNull().default('pouzece'),
    status: orderStatusEnum('status').notNull().default('na_cekanju'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_business_account_id_idx').on(table.businessAccountId),
    index('orders_broj_idx').on(table.broj),
    index('orders_status_idx').on(table.status),
  ],
);

export const orderShipments = pgTable(
  'order_shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    iznosStavki: integer('iznos_stavki').notNull(),
    cijenaDostave: integer('cijena_dostave').notNull(),
    besplatnaDostava: boolean('besplatna_dostava').notNull().default(false),
    status: orderShipmentStatusEnum('status').notNull().default('novo'),
    kurir: text('kurir'),
    brojPosiljke: text('broj_posiljke'),
    poslanoAt: timestamp('poslano_at', { withTimezone: true }),
    isporucenoAt: timestamp('isporuceno_at', { withTimezone: true }),
  },
  (table) => [
    index('order_shipments_order_id_idx').on(table.orderId),
    index('order_shipments_brand_id_idx').on(table.brandId),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => orderShipments.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    nazivSnapshot: text('naziv_snapshot').notNull(),
    cijenaSnapshot: integer('cijena_snapshot').notNull(),
    kolicina: integer('kolicina').notNull(),
    provizijaPostoSnapshot: numeric('provizija_posto_snapshot', {
      precision: 5,
      scale: 2,
    }).notNull(),
    provizijaIznos: integer('provizija_iznos').notNull(),
    bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('order_items_shipment_id_idx').on(table.shipmentId),
    index('order_items_product_id_idx').on(table.productId),
    index('order_items_bundle_id_idx').on(table.bundleId),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderShipment = typeof orderShipments.$inferSelect;
export type NewOrderShipment = typeof orderShipments.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
