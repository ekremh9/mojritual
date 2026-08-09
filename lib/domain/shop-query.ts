import { and, asc, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import type { PgSelect } from 'drizzle-orm/pg-core';
import { productCategories, products } from '@/lib/db/schema';

export const PROIZVODA_PO_STRANICI = 20;

export const SHOP_FORME = [
  'kapsula',
  'tableta',
  'prah',
  'tecnost',
  'gel',
  'krema',
  'zvakaca',
] as const;

export type ShopForma = (typeof SHOP_FORME)[number];

export const SHOP_SORTOVI = ['novo', 'cijena_asc', 'cijena_desc'] as const;

export type ShopSort = (typeof SHOP_SORTOVI)[number];

export const SHOP_SORT_PODRAZUMIJEVANI: ShopSort = 'novo';

export type ShopSearchParams = Record<string, string | string[] | undefined>;

export type ShopFilteri = {
  q: string | null;
  kategorija: string | null;
  forma: ShopForma | null;
  sort: ShopSort;
  stranica: number;
};

function prviString(vrijednost: string | string[] | undefined): string | undefined {
  return Array.isArray(vrijednost) ? vrijednost[0] : vrijednost;
}

function jeForma(vrijednost: string | undefined): vrijednost is ShopForma {
  return SHOP_FORME.includes(vrijednost as ShopForma);
}

function jeSort(vrijednost: string | undefined): vrijednost is ShopSort {
  return SHOP_SORTOVI.includes(vrijednost as ShopSort);
}

/**
 * Pretvara sirove URL parametre u normalizovane filtere. Nepoznate vrijednosti
 * se odbacuju umjesto da ruše stranicu — katalog je javan i URL je uređiv.
 */
export function parseShopParams(searchParams: ShopSearchParams): ShopFilteri {
  const q = prviString(searchParams.q)?.trim() ?? '';
  const kategorija = prviString(searchParams.kategorija)?.trim() ?? '';
  const forma = prviString(searchParams.forma);
  const sort = prviString(searchParams.sort);
  const stranica = Number.parseInt(prviString(searchParams.stranica) ?? '', 10);

  return {
    q: q.length > 0 ? q : null,
    kategorija: kategorija.length > 0 ? kategorija : null,
    forma: jeForma(forma) ? forma : null,
    sort: jeSort(sort) ? sort : SHOP_SORT_PODRAZUMIJEVANI,
    stranica: Number.isInteger(stranica) && stranica > 0 ? stranica : 1,
  };
}

export function imaAktivneFiltere(filteri: ShopFilteri): boolean {
  return (
    filteri.q !== null ||
    filteri.kategorija !== null ||
    filteri.forma !== null ||
    filteri.sort !== SHOP_SORT_PODRAZUMIJEVANI
  );
}

/**
 * Escapuje LIKE meta-znakove da korisnikov `%` ili `_` ne postane wildcard.
 * Vrijednost i dalje ide kroz Drizzle placeholder — ovo je samo semantika
 * uzorka, ne zaštita od injectiona.
 */
function escapeLikeUzorak(vrijednost: string): string {
  return vrijednost.replace(/[\\%_]/g, (znak) => `\\${znak}`);
}

export function shopUzorakPretrage(q: string): string {
  return `%${escapeLikeUzorak(q)}%`;
}

/**
 * Gradi WHERE za katalog. `kategorijaId` se prosljeđuje odvojeno jer dolazi iz
 * slug → id razrješenja; uslov ima smisla samo uz join iz `withKategorijaJoin`.
 */
export function buildShopWhere(filteri: ShopFilteri, kategorijaId: string | null): SQL | undefined {
  const uslovi: SQL[] = [eq(products.status, 'odobren')];

  if (filteri.q !== null) {
    const uzorak = shopUzorakPretrage(filteri.q);
    const pretraga = or(
      ilike(products.naziv, uzorak),
      ilike(products.kratkiOpis, uzorak),
      ilike(products.opis, uzorak),
    );

    if (pretraga) {
      uslovi.push(pretraga);
    }
  }

  if (filteri.forma !== null) {
    uslovi.push(eq(products.forma, filteri.forma));
  }

  if (kategorijaId !== null) {
    uslovi.push(eq(productCategories.categoryId, kategorijaId));
  }

  return and(...uslovi);
}

/**
 * Join se dodaje samo kad se filtrira po kategoriji. `product_categories` ima
 * složeni PK (product_id, category_id), pa jedna kategorija ne može duplirati
 * proizvod — count ostaje tačan bez DISTINCT.
 */
export function withKategorijaJoin<T extends PgSelect>(upit: T, kategorijaId: string | null): T {
  if (kategorijaId === null) {
    return upit;
  }

  return upit.innerJoin(
    productCategories,
    eq(productCategories.productId, products.id),
  ) as unknown as T;
}

export function buildShopOrderBy(sort: ShopSort): SQL[] {
  switch (sort) {
    case 'cijena_asc':
      return [asc(products.cijena), asc(products.id)];
    case 'cijena_desc':
      return [desc(products.cijena), asc(products.id)];
    case 'novo':
      return [desc(products.createdAt), asc(products.id)];
  }
}

export type ShopPaginacija = {
  stranica: number;
  ukupnoStranica: number;
  limit: number;
  offset: number;
};

export function shopPaginacija(ukupno: number, trazenaStranica: number): ShopPaginacija {
  const ukupnoStranica = Math.max(1, Math.ceil(ukupno / PROIZVODA_PO_STRANICI));
  const stranica = Math.min(Math.max(1, trazenaStranica), ukupnoStranica);

  return {
    stranica,
    ukupnoStranica,
    limit: PROIZVODA_PO_STRANICI,
    offset: (stranica - 1) * PROIZVODA_PO_STRANICI,
  };
}
