import { cache } from 'react';
import { asc, count, countDistinct, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, productCategories, products } from '@/lib/db/schema';

/**
 * Kategorije opisuju **šta proizvod jeste** i koriste se za navigaciju i filter
 * kataloga. Hijerarhija je dva nivoa: top-level (`parent_id IS NULL`) i
 * podkategorija. Proizvod se veže za podkategoriju, ali se broji i za njenog
 * roditelja.
 *
 * Ciljevi (`goals`) su odvojen model — **šta proizvod rješava** — i koriste se
 * isključivo u Ritual Vodiču. Ovdje se ne pojavljuju.
 */

export type KategorijaRed = {
  id: string;
  slug: string;
  naziv: string;
  opis: string | null;
  parentId: string | null;
  ikona: string | null;
  redoslijed: number;
};

export type KategorijaSaBrojem = {
  id: string;
  slug: string;
  naziv: string;
  opis: string | null;
  ikona: string | null;
  brojProizvoda: number;
};

export type KategorijaStablo = KategorijaSaBrojem & {
  podkategorije: KategorijaSaBrojem[];
};

/** Ručni redoslijed brenda ima prednost; naziv je samo stabilan tie-break. */
function usporediKategorije(a: KategorijaRed, b: KategorijaRed): number {
  if (a.redoslijed !== b.redoslijed) {
    return a.redoslijed - b.redoslijed;
  }

  return a.naziv.localeCompare(b.naziv, 'bs');
}

function saBrojem(kategorija: KategorijaRed, brojProizvoda: number): KategorijaSaBrojem {
  return {
    id: kategorija.id,
    slug: kategorija.slug,
    naziv: kategorija.naziv,
    opis: kategorija.opis,
    ikona: kategorija.ikona,
    brojProizvoda,
  };
}

/**
 * Čista logika slaganja stabla — izdvojena iz upita da bude testabilna.
 *
 * `brojPoKategoriji` je broj odobrenih proizvoda vezanih direktno za kategoriju,
 * a `brojPoKorijenu` je broj **različitih** proizvoda u cijelom podstablu jednog
 * korijena. Zbrajanje djece ne bi bilo tačno: isti proizvod može biti u dvije
 * podkategorije istog roditelja i tada bi se brojao dvaput.
 *
 * Izlaze samo kategorije koje imaju proizvode — prazna kategorija nije korisna
 * ni u navigaciji ni u filteru.
 */
export function sloziKategorijeStablo(
  sve: readonly KategorijaRed[],
  brojPoKategoriji: ReadonlyMap<string, number>,
  brojPoKorijenu: ReadonlyMap<string, number>,
): KategorijaStablo[] {
  const poredane = [...sve].sort(usporediKategorije);
  const stablo: KategorijaStablo[] = [];

  for (const kategorija of poredane) {
    if (kategorija.parentId !== null) {
      continue;
    }

    const brojUPodstablu = brojPoKorijenu.get(kategorija.id) ?? 0;
    if (brojUPodstablu === 0) {
      continue;
    }

    const podkategorije = poredane
      .filter((dijete) => dijete.parentId === kategorija.id)
      .map((dijete) => saBrojem(dijete, brojPoKategoriji.get(dijete.id) ?? 0))
      .filter((dijete) => dijete.brojProizvoda > 0);

    stablo.push({ ...saBrojem(kategorija, brojUPodstablu), podkategorije });
  }

  return stablo;
}

const getSveKategorije = cache(async (): Promise<KategorijaRed[]> => {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      naziv: categories.naziv,
      opis: categories.opis,
      parentId: categories.parentId,
      ikona: categories.ikona,
      redoslijed: categories.redoslijed,
    })
    .from(categories)
    .orderBy(asc(categories.redoslijed), asc(categories.naziv));
});

/** Broj odobrenih proizvoda direktno vezanih za svaku kategoriju. */
const getBrojPoKategoriji = cache(async (): Promise<Map<string, number>> => {
  const redovi = await db
    .select({
      categoryId: productCategories.categoryId,
      broj: count(products.id),
    })
    .from(productCategories)
    .innerJoin(products, eq(products.id, productCategories.productId))
    .where(eq(products.status, 'odobren'))
    .groupBy(productCategories.categoryId);

  return new Map(redovi.map((red) => [red.categoryId, Number(red.broj)]));
});

/**
 * Broj različitih odobrenih proizvoda po korijenu podstabla. `coalesce` svodi
 * podkategoriju na roditelja, a `count(distinct)` sprječava dvostruko brojanje
 * proizvoda koji je u više podkategorija istog korijena.
 */
const getBrojPoKorijenu = cache(async (): Promise<Map<string, number>> => {
  const korijenId = sql<string>`coalesce(${categories.parentId}, ${categories.id})`;

  const redovi = await db
    .select({
      korijenId,
      broj: countDistinct(products.id),
    })
    .from(productCategories)
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .innerJoin(products, eq(products.id, productCategories.productId))
    .where(eq(products.status, 'odobren'))
    .groupBy(korijenId);

  return new Map(redovi.map((red) => [red.korijenId, Number(red.broj)]));
});

/**
 * Sve kategorije koje imaju proizvode, organizovane hijerarhijski
 * (top-level → podkategorije). Za filter kataloga i navigaciju.
 */
export const getCategoryTree = cache(async (): Promise<KategorijaStablo[]> => {
  const [sve, brojPoKategoriji, brojPoKorijenu] = await Promise.all([
    getSveKategorije(),
    getBrojPoKategoriji(),
    getBrojPoKorijenu(),
  ]);

  return sloziKategorijeStablo(sve, brojPoKategoriji, brojPoKorijenu);
});

/**
 * Top-level kategorije koje imaju bar jedan proizvod — direktno ili kroz neku
 * svoju podkategoriju. `brojProizvoda` je broj proizvoda u cijelom podstablu.
 */
export const getTopLevelCategoriesWithProducts = cache(
  async (): Promise<KategorijaSaBrojem[]> => {
    const stablo = await getCategoryTree();

    return stablo.map((kategorija) => ({
      id: kategorija.id,
      slug: kategorija.slug,
      naziv: kategorija.naziv,
      opis: kategorija.opis,
      ikona: kategorija.ikona,
      brojProizvoda: kategorija.brojProizvoda,
    }));
  },
);
