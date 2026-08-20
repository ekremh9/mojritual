/**
 * Proizvodi za admin pregled i odobravanje — svi brendovi, ne samo jedan.
 */
import { and, asc, count, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, categories, productCategories, productImages, products } from '@/lib/db/schema';
import type { Product } from '@/lib/db/schema';
import { jeProizvodStatus, PRODUCT_STATUSI } from '@/lib/domain/portal-products';

export { jeProizvodStatus, PRODUCT_STATUSI };

export type AdminProizvodNaCekanju = {
  id: string;
  naziv: string;
  cijena: number;
  status: Product['status'];
  istaknutStatus: Product['istaknutStatus'];
  createdAt: Date;
  brend: { naziv: string; slug: string };
  slika: { url: string; alt: string | null } | null;
  kategorija: { naziv: string; slug: string } | null;
};

/**
 * Proizvodi za admin listu, svi brendovi, opciono filtrirani po statusu
 * proizvoda i/ili statusu zahtjeva za isticanje (nezavisna osa — vidi
 * `products.istaknutStatus`). Kad je stavljen filter "zahtjevi za isticanje
 * na čekanju" (istaknutStatusFilter='na_cekanju'), poziva se BEZ statusFilter
 * (vidi app/admin/proizvodi/page.tsx) — zahtjev za isticanje može stići i na
 * proizvodu koji je već odobren, pa se ne smije suziti na jedan status.
 *
 * Sortiranje zavisi od taba: "Na čekanju" (bilo koja od dvije ose) sortira
 * najstariji prvo — oni koji čekaju najduže trebaju biti obrađeni prvi.
 * Svaki drugi tab (Svi, Odobreni, Odbijeni, Nacrti) sortira najnoviji prvo —
 * tamo je "šta se nedavno desilo" relevantnije od reda čekanja.
 */
export async function getProductsByStatus(
  statusFilter?: Product['status'],
  istaknutStatusFilter?: Product['istaknutStatus'],
): Promise<AdminProizvodNaCekanju[]> {
  const uslovi = [];
  if (statusFilter) {
    uslovi.push(eq(products.status, statusFilter));
  } else if (!istaknutStatusFilter) {
    // Tab "Svi" (nijedan filter proslijeđen) namjerno isključuje 'nacrt' —
    // nacrti su partnerov privatan radni prostor bez ikakve admin akcije
    // nad njima, samo ometaju pregled. Tab "Nacrt" i dalje postoji zasebno
    // (statusFilter='nacrt' eksplicitno) za namjeran uvid.
    uslovi.push(ne(products.status, 'nacrt'));
  }
  if (istaknutStatusFilter) {
    uslovi.push(eq(products.istaknutStatus, istaknutStatusFilter));
  }
  const uslov = uslovi.length > 0 ? and(...uslovi) : undefined;

  const redoslijed =
    statusFilter === 'na_cekanju' || istaknutStatusFilter === 'na_cekanju'
      ? asc(products.createdAt)
      : desc(products.createdAt);

  const odabraniProizvodi = await db
    .select({
      id: products.id,
      naziv: products.naziv,
      cijena: products.cijena,
      status: products.status,
      istaknutStatus: products.istaknutStatus,
      createdAt: products.createdAt,
      brendNaziv: brands.naziv,
      brendSlug: brands.slug,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(uslov)
    .orderBy(redoslijed);

  if (odabraniProizvodi.length === 0) {
    return [];
  }

  const ids = odabraniProizvodi.map((proizvod) => proizvod.id);

  const slike = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
      redoslijed: productImages.redoslijed,
    })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  const kategorijeRedovi = await db
    .select({
      productId: productCategories.productId,
      naziv: categories.naziv,
      slug: categories.slug,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(inArray(productCategories.productId, ids))
    .orderBy(asc(categories.naziv));

  const prvaKategorijaPoProizvodu = new Map<string, { naziv: string; slug: string }>();
  for (const red of kategorijeRedovi) {
    if (!prvaKategorijaPoProizvodu.has(red.productId)) {
      prvaKategorijaPoProizvodu.set(red.productId, { naziv: red.naziv, slug: red.slug });
    }
  }

  return odabraniProizvodi.map((proizvod) => ({
    id: proizvod.id,
    naziv: proizvod.naziv,
    cijena: proizvod.cijena,
    status: proizvod.status,
    istaknutStatus: proizvod.istaknutStatus,
    createdAt: proizvod.createdAt,
    brend: { naziv: proizvod.brendNaziv, slug: proizvod.brendSlug },
    slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
    kategorija: prvaKategorijaPoProizvodu.get(proizvod.id) ?? null,
  }));
}

export type AdminProizvodBrojaci = Record<Product['status'], number>;

/** Broj proizvoda po svakom statusu — za brojeve uz filter tabove. */
export async function getProductStatusCounts(): Promise<AdminProizvodBrojaci> {
  const redovi = await db
    .select({ status: products.status, ukupno: count() })
    .from(products)
    .groupBy(products.status);

  const brojaci: AdminProizvodBrojaci = { nacrt: 0, na_cekanju: 0, odobren: 0, odbijen: 0 };
  for (const red of redovi) {
    brojaci[red.status] = red.ukupno;
  }
  return brojaci;
}

/**
 * Broj proizvoda čiji je zahtjev za isticanje na čekanju admin odluke —
 * nezavisno od `products.status` (vidi napomenu uz `getProductsByStatus`).
 * Koristi se za dashboard karticu i brojač uz tab na /admin/proizvodi.
 */
export async function getPendingFeaturedCount(): Promise<number> {
  const [red] = await db
    .select({ ukupno: count() })
    .from(products)
    .where(eq(products.istaknutStatus, 'na_cekanju'));

  return red?.ukupno ?? 0;
}

export type AdminProizvodDetalj = {
  id: string;
  naziv: string;
  kratkiOpis: string | null;
  opis: string | null;
  forma: Product['forma'];
  sastojci: string | null;
  doziranje: string | null;
  upozorenja: string | null;
  cijena: number;
  staraCijena: number | null;
  dostupnost: Product['dostupnost'];
  status: Product['status'];
  razlogOdbijanja: string | null;
  oznake: string[] | null;
  istaknutStatus: Product['istaknutStatus'];
  istaknutRazlogOdbijanja: string | null;
  createdAt: Date;
  updatedAt: Date;
  brend: { naziv: string; slug: string };
  slike: { url: string; alt: string | null }[];
  kategorije: { naziv: string; slug: string }[];
};

/**
 * Proizvod sa svim podacima za admin pregled — bez obzira na status, jer
 * admin mora vidjeti i već obrađene proizvode (odobren/odbijen), ne samo
 * one na čekanju.
 */
export async function getProductForAdmin(productId: string): Promise<AdminProizvodDetalj | null> {
  const [proizvod] = await db
    .select({
      id: products.id,
      naziv: products.naziv,
      kratkiOpis: products.kratkiOpis,
      opis: products.opis,
      forma: products.forma,
      sastojci: products.sastojci,
      doziranje: products.doziranje,
      upozorenja: products.upozorenja,
      cijena: products.cijena,
      staraCijena: products.staraCijena,
      dostupnost: products.dostupnost,
      status: products.status,
      razlogOdbijanja: products.razlogOdbijanja,
      oznake: products.oznake,
      istaknutStatus: products.istaknutStatus,
      istaknutRazlogOdbijanja: products.istaknutRazlogOdbijanja,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      brendNaziv: brands.naziv,
      brendSlug: brands.slug,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.id, productId))
    .limit(1);

  if (!proizvod) {
    return null;
  }

  const [slike, kategorijeRedovi] = await Promise.all([
    db
      .select({ url: productImages.url, alt: productImages.alt })
      .from(productImages)
      .where(eq(productImages.productId, proizvod.id))
      .orderBy(asc(productImages.redoslijed)),
    db
      .select({ naziv: categories.naziv, slug: categories.slug })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, proizvod.id)),
  ]);

  return {
    id: proizvod.id,
    naziv: proizvod.naziv,
    kratkiOpis: proizvod.kratkiOpis,
    opis: proizvod.opis,
    forma: proizvod.forma,
    sastojci: proizvod.sastojci,
    doziranje: proizvod.doziranje,
    upozorenja: proizvod.upozorenja,
    cijena: proizvod.cijena,
    staraCijena: proizvod.staraCijena,
    dostupnost: proizvod.dostupnost,
    status: proizvod.status,
    razlogOdbijanja: proizvod.razlogOdbijanja,
    oznake: proizvod.oznake,
    istaknutStatus: proizvod.istaknutStatus,
    istaknutRazlogOdbijanja: proizvod.istaknutRazlogOdbijanja,
    createdAt: proizvod.createdAt,
    updatedAt: proizvod.updatedAt,
    brend: { naziv: proizvod.brendNaziv, slug: proizvod.brendSlug },
    slike,
    kategorije: kategorijeRedovi,
  };
}

export type AdminProizvodStats = { naCekanju: number; odobreno: number };

/** Brojevi za admin pregled — proizvoda na čekanju i ukupno odobrenih. */
export async function getProductApprovalStats(): Promise<AdminProizvodStats> {
  const [naCekanju] = await db
    .select({ ukupno: count() })
    .from(products)
    .where(eq(products.status, 'na_cekanju'));
  const [odobreno] = await db
    .select({ ukupno: count() })
    .from(products)
    .where(eq(products.status, 'odobren'));

  return { naCekanju: naCekanju?.ukupno ?? 0, odobreno: odobreno?.ukupno ?? 0 };
}
