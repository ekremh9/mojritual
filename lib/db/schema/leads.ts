import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const vendorLeadStatusEnum = pgEnum('vendor_lead_status', [
  'novo',
  'kontaktirano',
  'u_pregovorima',
  'zatvoreno',
]);

export const vendorLeads = pgTable(
  'vendor_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nazivFirme: text('naziv_firme').notNull(),
    kontaktOsoba: text('kontakt_osoba').notNull(),
    email: text('email').notNull(),
    telefon: text('telefon'),
    kategorija: text('kategorija'),
    poruka: text('poruka'),
    status: vendorLeadStatusEnum('status').notNull().default('novo'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('vendor_leads_status_idx').on(table.status)],
);

export type VendorLead = typeof vendorLeads.$inferSelect;
export type NewVendorLead = typeof vendorLeads.$inferInsert;
