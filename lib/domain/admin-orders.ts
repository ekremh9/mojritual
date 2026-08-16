/**
 * Narudžbe za admin pregled — sve narudžbe, svi brendovi. Za razliku od
 * javne stranice narudžbe (app/(shop)/narudzba/[broj]/page.tsx), ovo je
 * administrativni kontekst i smije prikazati PII (ime, email, telefon,
 * adresu) na detalju — ali ne u listi, vidi getOrdersOverview.
 */
import { asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, orderItems, orderShipments, orders } from '@/lib/db/schema';
import type { Order, OrderShipment } from '@/lib/db/schema';

export const ORDER_STATUSI = [
  'na_cekanju',
  'potvrdjeno',
  'djelimicno_poslano',
  'poslano',
  'isporuceno',
  'otkazano',
] as const satisfies readonly Order['status'][];

export function jeOrderStatus(vrijednost: string): vrijednost is Order['status'] {
  return (ORDER_STATUSI as readonly string[]).includes(vrijednost);
}

export type AdminNarudzbaPregled = {
  id: string;
  broj: string;
  createdAt: Date;
  kupacIme: string;
  ukupno: number;
  status: Order['status'];
  brojPosiljki: number;
};

/**
 * Narudžbe za admin listu, opciono filtrirane po statusu, najnovije prvo.
 * Namjerno NE selektuje email/telefon/adresu — lista je pregled, PII
 * minimizacija (CLAUDE.md pravilo 4), puni podaci su na detalju narudžbe.
 */
export async function getOrdersOverview(statusFilter?: Order['status']): Promise<AdminNarudzbaPregled[]> {
  const uslov = statusFilter ? eq(orders.status, statusFilter) : undefined;

  const odabraneNarudzbe = await db
    .select({
      id: orders.id,
      broj: orders.broj,
      createdAt: orders.createdAt,
      kupacIme: orders.kupacIme,
      ukupno: orders.ukupno,
      status: orders.status,
    })
    .from(orders)
    .where(uslov)
    .orderBy(desc(orders.createdAt));

  if (odabraneNarudzbe.length === 0) {
    return [];
  }

  const ids = odabraneNarudzbe.map((narudzba) => narudzba.id);

  const posiljkeRedovi = await db
    .select({ orderId: orderShipments.orderId, ukupno: count() })
    .from(orderShipments)
    .where(inArray(orderShipments.orderId, ids))
    .groupBy(orderShipments.orderId);

  const brojPosiljkiPoNarudzbi = new Map(posiljkeRedovi.map((red) => [red.orderId, red.ukupno]));

  return odabraneNarudzbe.map((narudzba) => ({
    ...narudzba,
    brojPosiljki: brojPosiljkiPoNarudzbi.get(narudzba.id) ?? 0,
  }));
}

export type AdminNarudzbaBrojaci = Record<Order['status'], number>;

/** Broj narudžbi po svakom statusu — za brojeve uz filter tabove. */
export async function getOrderStatusCounts(): Promise<AdminNarudzbaBrojaci> {
  const redovi = await db.select({ status: orders.status, ukupno: count() }).from(orders).groupBy(orders.status);

  const brojaci: AdminNarudzbaBrojaci = {
    na_cekanju: 0,
    potvrdjeno: 0,
    djelimicno_poslano: 0,
    poslano: 0,
    isporuceno: 0,
    otkazano: 0,
  };
  for (const red of redovi) {
    brojaci[red.status] = red.ukupno;
  }
  return brojaci;
}

export type AdminNarudzbaDetaljStavka = {
  nazivSnapshot: string;
  cijenaSnapshot: number;
  kolicina: number;
};

export type AdminNarudzbaDetaljPosiljka = {
  id: string;
  brend: { naziv: string; slug: string };
  status: OrderShipment['status'];
  kurir: string | null;
  brojPosiljke: string | null;
  cijenaDostave: number;
  besplatnaDostava: boolean;
  iznosStavki: number;
  stavke: AdminNarudzbaDetaljStavka[];
};

export type AdminNarudzbaDetalj = {
  id: string;
  broj: string;
  createdAt: Date;
  status: Order['status'];
  tip: Order['tip'];
  kupacIme: string;
  kupacEmail: string;
  kupacTelefon: string;
  adresa: string;
  grad: string;
  postanskiBroj: string;
  napomena: string | null;
  iznosStavki: number;
  iznosDostave: number;
  ukupno: number;
  posiljke: AdminNarudzbaDetaljPosiljka[];
};

/**
 * Puna narudžba za admin detalj — SMIJE vratiti PII (ime, email, telefon,
 * adresu). Ovo je interni administrativni ekran za koordinaciju dostave i
 * eventualne reklamacije, razlikuje se od javne stranice narudžbe.
 */
export async function getOrderDetail(orderId: string): Promise<AdminNarudzbaDetalj | null> {
  const [narudzba] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  if (!narudzba) {
    return null;
  }

  const posiljke = await db
    .select({
      id: orderShipments.id,
      status: orderShipments.status,
      kurir: orderShipments.kurir,
      brojPosiljke: orderShipments.brojPosiljke,
      cijenaDostave: orderShipments.cijenaDostave,
      besplatnaDostava: orderShipments.besplatnaDostava,
      iznosStavki: orderShipments.iznosStavki,
      brendNaziv: brands.naziv,
      brendSlug: brands.slug,
    })
    .from(orderShipments)
    .innerJoin(brands, eq(orderShipments.brandId, brands.id))
    .where(eq(orderShipments.orderId, orderId))
    .orderBy(asc(brands.naziv));

  const stavke =
    posiljke.length === 0
      ? []
      : await db
          .select({
            shipmentId: orderItems.shipmentId,
            nazivSnapshot: orderItems.nazivSnapshot,
            cijenaSnapshot: orderItems.cijenaSnapshot,
            kolicina: orderItems.kolicina,
          })
          .from(orderItems)
          .where(
            inArray(
              orderItems.shipmentId,
              posiljke.map((posiljka) => posiljka.id),
            ),
          );

  const stavkePoPosiljci = new Map<string, AdminNarudzbaDetaljStavka[]>();
  for (const stavka of stavke) {
    const postojece = stavkePoPosiljci.get(stavka.shipmentId) ?? [];
    postojece.push(stavka);
    stavkePoPosiljci.set(stavka.shipmentId, postojece);
  }

  return {
    id: narudzba.id,
    broj: narudzba.broj,
    createdAt: narudzba.createdAt,
    status: narudzba.status,
    tip: narudzba.tip,
    kupacIme: narudzba.kupacIme,
    kupacEmail: narudzba.kupacEmail,
    kupacTelefon: narudzba.kupacTelefon,
    adresa: narudzba.adresa,
    grad: narudzba.grad,
    postanskiBroj: narudzba.postanskiBroj,
    napomena: narudzba.napomena,
    iznosStavki: narudzba.iznosStavki,
    iznosDostave: narudzba.iznosDostave,
    ukupno: narudzba.ukupno,
    posiljke: posiljke.map((posiljka) => ({
      id: posiljka.id,
      brend: { naziv: posiljka.brendNaziv, slug: posiljka.brendSlug },
      status: posiljka.status,
      kurir: posiljka.kurir,
      brojPosiljke: posiljka.brojPosiljke,
      cijenaDostave: posiljka.cijenaDostave,
      besplatnaDostava: posiljka.besplatnaDostava,
      iznosStavki: posiljka.iznosStavki,
      stavke: stavkePoPosiljci.get(posiljka.id) ?? [],
    })),
  };
}
