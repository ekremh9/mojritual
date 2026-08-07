import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';
import { orderShipments, orders } from './orders';
import { users } from './users';

export const supportTicketTipEnum = pgEnum('support_ticket_tip', [
  'reklamacija',
  'povrat',
  'ostecena_posiljka',
  'upit',
]);

export const supportTicketStatusEnum = pgEnum('support_ticket_status', [
  'novo',
  'kod_brenda',
  'u_obradi',
  'rijeseno',
  'odbijeno',
  'eskalirano',
]);

export const supportTicketRjesenjeEnum = pgEnum('support_ticket_rjesenje', [
  'zamjena',
  'povrat_novca',
  'popust',
  'odbijeno',
]);

export const ticketMessageAutorTipEnum = pgEnum('ticket_message_autor_tip', [
  'kupac',
  'brend',
  'admin',
]);

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    broj: text('broj').notNull().unique(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => orderShipments.id, { onDelete: 'restrict' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    tip: supportTicketTipEnum('tip').notNull(),
    status: supportTicketStatusEnum('status').notNull().default('novo'),
    kupacIme: text('kupac_ime').notNull(),
    kupacEmail: text('kupac_email').notNull(),
    kupacTelefon: text('kupac_telefon').notNull(),
    predmet: text('predmet').notNull(),
    opis: text('opis').notNull(),
    slike: text('slike').array(),
    rokOdgovoraAt: timestamp('rok_odgovora_at', { withTimezone: true }).notNull(),
    eskalirano: boolean('eskalirano').notNull().default(false),
    eskaliranoAt: timestamp('eskalirano_at', { withTimezone: true }),
    rjesenje: supportTicketRjesenjeEnum('rjesenje'),
    iznosPovrata: integer('iznos_povrata'),
    zatvorenoAt: timestamp('zatvoreno_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('support_tickets_order_id_idx').on(table.orderId),
    index('support_tickets_shipment_id_idx').on(table.shipmentId),
    index('support_tickets_brand_id_idx').on(table.brandId),
    index('support_tickets_status_idx').on(table.status),
  ],
);

export const ticketMessages = pgTable(
  'ticket_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id, { onDelete: 'cascade' }),
    autorUserId: uuid('autor_user_id').references(() => users.id, { onDelete: 'set null' }),
    autorTip: ticketMessageAutorTipEnum('autor_tip').notNull(),
    poruka: text('poruka').notNull(),
    slike: text('slike').array(),
    interno: boolean('interno').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('ticket_messages_ticket_id_idx').on(table.ticketId)],
);

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type NewTicketMessage = typeof ticketMessages.$inferInsert;
