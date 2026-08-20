/**
 * Proizvodi u portalu za brend — lista i brojevi po statusu.
 * Brend mora vidjeti sve svoje proizvode bez obzira na status, uključujući
 * nacrte i odbijene, ne samo odobrene.
 */
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  categories,
  productCategories,
  productGoalProposals,
  productImages,
  products,
  wholesalePriceTiers,
} from '@/lib/db/schema';
import type { Product } from '@/lib/db/schema';
import type { ProizvodUnos } from '@/lib/domain/product-form';
import { feningToKm } from '@/lib/domain/format';

export const PRODUCT_STATUSI = [
  'nacrt',
  'na_cekanju',
  'odobren',
  'odbijen',
] as const satisfies readonly Product['status'][];

export function jeProizvodStatus(vrijednost: string): vrijednost is Product['status'] {
  return (PRODUCT_STATUSI as readonly string[]).includes(vrijednost);
}

export type PortalProizvod = {
  id: string;
  naziv: string;
  cijena: number;
  status: Product['status'];
  istaknutStatus: Product['istaknutStatus'];
  razlogOdbijanja: string | null;
  createdAt: Date;
  slika: { url: string; alt: string | null } | null;
  kategorija: { naziv: string; slug: string } | null;
};

/**
 * Dohvata proizvode brenda, opciono filtrirane po statusu i/ili isticanju,
 * sortirane najnovije prvo, sa prvom slikom i prvom kategorijom po
 * proizvodu.
 *
 * `statusFilter` (status proizvoda) i `istaknutoFilter` (isticanje na
 * početnoj) su NEZAVISNE ose — proizvod može istovremeno biti
 * status='odobren' i istaknutStatus='odobreno'. Portal ih koristi kao dva
 * odvojena filter taba, nikad kombinovano u istom zahtjevu (vidi
 * app/portal/proizvodi/page.tsx), ali funkcija ih ovdje ne isključuje
 * međusobno da poziv ostane ispravan i ako se to jednom promijeni.
 */
export async function getBrandProducts(
  brandId: string,
  statusFilter?: Product['status'],
  istaknutoFilter?: boolean,
): Promise<PortalProizvod[]> {
  const uslovi = [eq(products.brandId, brandId)];

  if (statusFilter) {
    uslovi.push(eq(products.status, statusFilter));
  }

  if (istaknutoFilter) {
    uslovi.push(eq(products.istaknutStatus, 'odobreno'));
  }

  const uslov = uslovi.length > 1 ? and(...uslovi) : uslovi[0];

  const odabraniProizvodi = await db
    .select({
      id: products.id,
      naziv: products.naziv,
      cijena: products.cijena,
      status: products.status,
      istaknutStatus: products.istaknutStatus,
      razlogOdbijanja: products.razlogOdbijanja,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(uslov)
    .orderBy(desc(products.createdAt));

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
    ...proizvod,
    slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
    kategorija: prvaKategorijaPoProizvodu.get(proizvod.id) ?? null,
  }));
}

export type PortalProizvodBrojaci = Record<Product['status'], number> & { istaknuto: number };

/**
 * Broj proizvoda brenda po svakom statusu, plus zaseban brojač za
 * "Istaknuto" (istaknutStatus='odobreno') — za brojeve uz filter tabove.
 * `istaknuto` je nezavisan od statusnih brojača, ne zbraja se u njih (vidi
 * `getBrandProducts`).
 */
export async function getBrandProductCounts(brandId: string): Promise<PortalProizvodBrojaci> {
  const [redovi, [istaknutoRed]] = await Promise.all([
    db
      .select({ status: products.status, ukupno: count() })
      .from(products)
      .where(eq(products.brandId, brandId))
      .groupBy(products.status),
    db
      .select({ ukupno: count() })
      .from(products)
      .where(and(eq(products.brandId, brandId), eq(products.istaknutStatus, 'odobreno'))),
  ]);

  const brojaci: PortalProizvodBrojaci = {
    nacrt: 0,
    na_cekanju: 0,
    odobren: 0,
    odbijen: 0,
    istaknuto: istaknutoRed?.ukupno ?? 0,
  };
  for (const red of redovi) {
    brojaci[red.status] = red.ukupno;
  }
  return brojaci;
}

export type PortalProizvodZaUredjivanje = {
  id: string;
  status: Product['status'];
  razlogOdbijanja: string | null;
  istaknutStatus: Product['istaknutStatus'];
  istaknutRazlogOdbijanja: string | null;
  pocetneVrijednosti: ProizvodUnos;
  slike: { id: string; url: string; alt: string | null }[];
};

/**
 * Proizvod za formu uređivanja u portalu — samo ako pripada datom brendu.
 * `null` znači "ne postoji ili nije vaš" — stranica to tretira jednako
 * (notFound), da se ne otkriva postojanje tuđeg proizvoda.
 */
export async function getPortalProductForEdit(
  brandId: string,
  productId: string,
): Promise<PortalProizvodZaUredjivanje | null> {
  const [proizvod] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.brandId, brandId)))
    .limit(1);

  if (!proizvod) {
    return null;
  }

  const kategorijeProizvoda = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, proizvod.id));

  const prijedloziCiljevaProizvoda = await db
    .select({ goalId: productGoalProposals.goalId })
    .from(productGoalProposals)
    .where(eq(productGoalProposals.productId, proizvod.id));

  const slikeProizvoda = await db
    .select({ id: productImages.id, url: productImages.url, alt: productImages.alt })
    .from(productImages)
    .where(eq(productImages.productId, proizvod.id))
    .orderBy(asc(productImages.redoslijed));

  const wholesalePragoviProizvoda = await db
    .select({ minKolicina: wholesalePriceTiers.minKolicina, popustPosto: wholesalePriceTiers.popustPosto })
    .from(wholesalePriceTiers)
    .where(eq(wholesalePriceTiers.productId, proizvod.id))
    .orderBy(asc(wholesalePriceTiers.minKolicina));

  return {
    id: proizvod.id,
    status: proizvod.status,
    razlogOdbijanja: proizvod.razlogOdbijanja,
    istaknutStatus: proizvod.istaknutStatus,
    istaknutRazlogOdbijanja: proizvod.istaknutRazlogOdbijanja,
    slike: slikeProizvoda,
    pocetneVrijednosti: {
      naziv: proizvod.naziv,
      kratkiOpis: proizvod.kratkiOpis ?? '',
      opis: proizvod.opis ?? '',
      forma: proizvod.forma,
      kategorije: kategorijeProizvoda.map((red) => red.categoryId),
      sastojci: proizvod.sastojci ?? '',
      doziranje: proizvod.doziranje ?? '',
      upozorenja: proizvod.upozorenja ?? '',
      cijenaKm: feningToKm(proizvod.cijena).toFixed(2),
      staraCijenaKm: proizvod.staraCijena === null ? '' : feningToKm(proizvod.staraCijena).toFixed(2),
      dostupnost: proizvod.dostupnost,
      // Select je "izabran" i dok se čeka odluka i dok je već odobreno —
      // oba znače aktivan zahtjev/status sa brendove tačke gledišta.
      istaknutZahtjev:
        proizvod.istaknutStatus === 'na_cekanju' || proizvod.istaknutStatus === 'odobreno',
      istaknutPlanId: proizvod.istaknutPlanId ?? '',
      predlozeniCiljevi: prijedloziCiljevaProizvoda.map((red) => red.goalId),
      wholesalePragovi: wholesalePragoviProizvoda.map((prag) => ({
        minKolicina: prag.minKolicina,
        popustPosto: Number(prag.popustPosto),
      })),
    },
  };
}
