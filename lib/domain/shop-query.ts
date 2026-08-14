import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { brands, productCategories, products } from '@/lib/db/schema';

// Samostalni graditelj upita — podupit za kategorije ne treba konekciju na bazu,
// pa `/lib/domain` ostaje bez zavisnosti na `db`.
const upitnik = new QueryBuilder();

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

export type KategorijaIzbor = {
  id: string;
  slug: string;
  podkategorije: readonly { id: string; slug: string }[];
};

/**
 * Iz slug-a razrješava listu ID-eva kategorija za filter. Za top-level
 * kategoriju vraća njen ID **i ID-eve svih podkategorija**, jer su proizvodi
 * vezani za podkategorije — filter po roditelju mora obuhvatiti cijelo
 * podstablo. Za podkategoriju vraća samo njen ID.
 *
 * `null` znači "bez filtera", a prazan niz znači nepoznat slug — to je filter
 * bez rezultata, ne filter koji se tiho ignoriše. URL je javan i uređiv.
 */
export function razrijesiKategorijuIds(
  stablo: readonly KategorijaIzbor[],
  slug: string | null,
): string[] | null {
  if (slug === null) {
    return null;
  }

  const korijen = stablo.find((kategorija) => kategorija.slug === slug);
  if (korijen) {
    return [korijen.id, ...korijen.podkategorije.map((dijete) => dijete.id)];
  }

  for (const kategorija of stablo) {
    const dijete = kategorija.podkategorije.find((pod) => pod.slug === slug);
    if (dijete) {
      return [dijete.id];
    }
  }

  return [];
}

/**
 * Gradi WHERE za katalog. `kategorijaIds` se prosljeđuje odvojeno jer dolazi iz
 * `razrijesiKategorijuIds`. Uslov je `IN (subquery)` umjesto joina — proizvod u
 * dvije podkategorije istog roditelja inače bi se pojavio dvaput u rezultatu i
 * pokvario i listu i ukupan broj.
 *
 * Uslov na `brands.status` zahtijeva da upit pozivaoca joinuje `brands` —
 * proizvod odobrenog statusa od brenda koji još nije odobren ne smije biti
 * javno vidljiv.
 */
export function buildShopWhere(
  filteri: ShopFilteri,
  kategorijaIds: readonly string[] | null,
): SQL | undefined {
  const uslovi: SQL[] = [eq(products.status, 'odobren'), eq(brands.status, 'odobren')];

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

  if (kategorijaIds !== null) {
    uslovi.push(
      kategorijaIds.length === 0
        ? sql`false`
        : inArray(
            products.id,
            upitnik
              .select({ productId: productCategories.productId })
              .from(productCategories)
              .where(inArray(productCategories.categoryId, [...kategorijaIds])),
          ),
    );
  }

  return and(...uslovi);
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
