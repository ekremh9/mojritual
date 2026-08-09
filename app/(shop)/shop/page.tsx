import type { Metadata } from 'next';
import { asc, count, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, productImages, products } from '@/lib/db/schema';
import {
  buildShopOrderBy,
  buildShopWhere,
  imaAktivneFiltere,
  parseShopParams,
  shopPaginacija,
  withKategorijaJoin,
  type ShopFilteri,
  type ShopSearchParams,
} from '@/lib/domain/shop-query';
import { bs } from '@/lib/i18n/bs';
import { ProizvodKartica } from '../_components/ProizvodKartica';
import { ShopFilterPanel, ShopPretraga } from './_components/ShopFilters';
import { ShopPaginacija } from './_components/ShopPaginacija';

export const metadata: Metadata = {
  title: bs.shop.naslov,
  description: bs.shop.metaOpis,
};

type ShopPageProps = {
  searchParams: Promise<ShopSearchParams>;
};

async function getKategorije() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      naziv: categories.naziv,
    })
    .from(categories)
    .orderBy(asc(categories.redoslijed), asc(categories.naziv));
}

async function getUkupnoProizvoda(filteri: ShopFilteri, kategorijaId: string | null) {
  const redovi = await withKategorijaJoin(
    db.select({ ukupno: count() }).from(products).$dynamic(),
    kategorijaId,
  ).where(buildShopWhere(filteri, kategorijaId));

  return redovi[0]?.ukupno ?? 0;
}

async function getProizvodi(
  filteri: ShopFilteri,
  kategorijaId: string | null,
  limit: number,
  offset: number,
) {
  const odabraniProizvodi = await withKategorijaJoin(
    db
      .select({
        id: products.id,
        slug: products.slug,
        naziv: products.naziv,
        kratkiOpis: products.kratkiOpis,
        cijena: products.cijena,
      })
      .from(products)
      .$dynamic(),
    kategorijaId,
  )
    .where(buildShopWhere(filteri, kategorijaId))
    .orderBy(...buildShopOrderBy(filteri.sort))
    .limit(limit)
    .offset(offset);

  if (odabraniProizvodi.length === 0) {
    return [];
  }

  const slike = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
      redoslijed: productImages.redoslijed,
    })
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        odabraniProizvodi.map((proizvod) => proizvod.id),
      ),
    )
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  return odabraniProizvodi.map((proizvod) => ({
    ...proizvod,
    slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
  }));
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const filteri = parseShopParams(await searchParams);
  const kategorije = await getKategorije();

  const odabranaKategorija =
    filteri.kategorija === null
      ? null
      : (kategorije.find((kategorija) => kategorija.slug === filteri.kategorija) ?? null);

  // Slug iz URL-a koji ne postoji tretiramo kao filter bez rezultata, ne kao
  // filter koji se tiho ignoriše — inače bi korisnik vidio cijeli katalog.
  const nepoznataKategorija = filteri.kategorija !== null && odabranaKategorija === null;
  const kategorijaId = odabranaKategorija?.id ?? null;

  const ukupno = nepoznataKategorija ? 0 : await getUkupnoProizvoda(filteri, kategorijaId);
  const paginacija = shopPaginacija(ukupno, filteri.stranica);
  const proizvodi =
    ukupno === 0
      ? []
      : await getProizvodi(filteri, kategorijaId, paginacija.limit, paginacija.offset);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{bs.shop.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/60">{bs.shop.rezultati(ukupno)}</p>
      </div>

      <div className="mt-6">
        <ShopPretraga filteri={filteri} />
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-60 lg:shrink-0">
          <ShopFilterPanel
            filteri={filteri}
            kategorije={kategorije.map(({ slug, naziv }) => ({ slug, naziv }))}
            aktivniFilteri={imaAktivneFiltere(filteri)}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {proizvodi.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
              <p className="max-w-md text-base text-[#1C2B22]/70">{bs.shop.prazno}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {proizvodi.map((proizvod) => (
                  <ProizvodKartica key={proizvod.id} proizvod={proizvod} />
                ))}
              </div>

              <ShopPaginacija
                filteri={filteri}
                stranica={paginacija.stranica}
                ukupnoStranica={paginacija.ukupnoStranica}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
