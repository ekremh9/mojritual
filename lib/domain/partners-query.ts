import { and, eq, ilike, type SQL } from 'drizzle-orm';
import { brands } from '@/lib/db/schema';

export const PARTNERI_SORTOVI = ['preporuceno', 'novo', 'naziv'] as const;

export type PartneriSort = (typeof PARTNERI_SORTOVI)[number];

export const PARTNERI_SORT_PODRAZUMIJEVANI: PartneriSort = 'preporuceno';

export type PartneriSearchParams = Record<string, string | string[] | undefined>;

export type PartneriFilteri = {
  q: string | null;
  sort: PartneriSort;
};

function prviString(vrijednost: string | string[] | undefined): string | undefined {
  return Array.isArray(vrijednost) ? vrijednost[0] : vrijednost;
}

function jeSort(vrijednost: string | undefined): vrijednost is PartneriSort {
  return (PARTNERI_SORTOVI as readonly string[]).includes(vrijednost as PartneriSort);
}

/**
 * Pretvara sirove URL parametre u normalizovane filtere. Nepoznate vrijednosti
 * se odbacuju umjesto da ruše stranicu — lista partnera je javna i URL je
 * uređiv (isti princip kao `parseShopParams`).
 */
export function parsePartneriParams(searchParams: PartneriSearchParams): PartneriFilteri {
  const q = prviString(searchParams.q)?.trim() ?? '';
  const sort = prviString(searchParams.sort);

  return {
    q: q.length > 0 ? q : null,
    sort: jeSort(sort) ? sort : PARTNERI_SORT_PODRAZUMIJEVANI,
  };
}

/**
 * Escapuje LIKE meta-znakove da korisnikov `%` ili `_` ne postane wildcard.
 * Vrijednost i dalje ide kroz Drizzle placeholder — ovo je samo semantika
 * uzorka, ne zaštita od injectiona.
 */
function escapeLikeUzorak(vrijednost: string): string {
  return vrijednost.replace(/[\\%_]/g, (znak) => `\\${znak}`);
}

export function partneriUzorakPretrage(q: string): string {
  return `%${escapeLikeUzorak(q)}%`;
}

/** Gradi WHERE za listu partnera — samo odobreni brendovi su javno vidljivi. */
export function buildPartneriWhere(filteri: PartneriFilteri): SQL | undefined {
  const uslovi: SQL[] = [eq(brands.status, 'odobren')];

  if (filteri.q !== null) {
    uslovi.push(ilike(brands.naziv, partneriUzorakPretrage(filteri.q)));
  }

  return and(...uslovi);
}

export type PartnerZaSortiranje = {
  verifikovan: boolean;
  brojProizvoda: number;
  createdAt: Date;
  naziv: string;
};

/**
 * Sortira partnere NAKON što je broj odobrenih proizvoda spojen u JS-u.
 * "preporuceno" zavisi od agregata (broj proizvoda po brendu) koji SQL
 * ORDER BY sam ne može izraziti bez podupita — lista partnera je mala, pa
 * je jednostavnije spojiti broj proizvoda posebnim upitom (kao slike u
 * shop/page.tsx) i sortirati u memoriji nego graditi složeniji upit.
 */
export function sortPartnere<T extends PartnerZaSortiranje>(
  partneri: readonly T[],
  sort: PartneriSort,
): T[] {
  const kopija = [...partneri];

  switch (sort) {
    case 'naziv':
      return kopija.sort((a, b) => a.naziv.localeCompare(b.naziv, 'bs'));
    case 'novo':
      return kopija.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case 'preporuceno':
      return kopija.sort((a, b) => {
        if (a.verifikovan !== b.verifikovan) {
          return a.verifikovan ? -1 : 1;
        }
        if (a.brojProizvoda !== b.brojProizvoda) {
          return b.brojProizvoda - a.brojProizvoda;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
}
