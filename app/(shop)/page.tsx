import Link from 'next/link';
import { and, asc, count, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, productImages, products } from '@/lib/db/schema';
import { getTopLevelCategoriesWithProducts } from '@/lib/domain/categories';
import { bs } from '@/lib/i18n/bs';
import { CategoryIcon } from './_components/CategoryIcon';
import { PartnerKartica } from './_components/PartnerKartica';
import { ProizvodKartica } from './_components/ProizvodKartica';

const BROJ_ISTAKNUTIH = 10;
const BROJ_ISTAKNUTIH_PARTNERA = 4;

const KOLONE_PROIZVODA = {
  id: products.id,
  slug: products.slug,
  naziv: products.naziv,
  kratkiOpis: products.kratkiOpis,
  cijena: products.cijena,
};

const KOLONE_PARTNERA = {
  id: brands.id,
  slug: brands.slug,
  naziv: brands.naziv,
  kratkiOpis: brands.kratkiOpis,
  logoUrl: brands.logoUrl,
  verifikovan: brands.verifikovan,
  createdAt: brands.createdAt,
};

/**
 * Prvo proizvodi koje je admin stvarno istakao (`products.istaknutStatus =
 * 'odobreno'`, odvojeno od statusa proizvoda samog — vidi
 * lib/db/schema/products.ts). Ako ih ima manje od BROJ_ISTAKNUTIH, popuni
 * razliku najnovijim odobrenim proizvodima koji već nisu u prvoj listi, da
 * homepage nikad ne izgleda prazno dok admin ne istakne dovoljno proizvoda.
 */
async function getIstaknutiProizvodi() {
  const istaknuti = await db
    .select(KOLONE_PROIZVODA)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(
      and(
        eq(products.istaknutStatus, 'odobreno'),
        eq(products.status, 'odobren'),
        eq(brands.status, 'odobren'),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(BROJ_ISTAKNUTIH);

  let odabraniProizvodi = istaknuti;

  if (odabraniProizvodi.length < BROJ_ISTAKNUTIH) {
    const preostalo = BROJ_ISTAKNUTIH - odabraniProizvodi.length;
    const uslovi = [eq(products.status, 'odobren'), eq(brands.status, 'odobren')];
    if (odabraniProizvodi.length > 0) {
      uslovi.push(
        notInArray(
          products.id,
          odabraniProizvodi.map((proizvod) => proizvod.id),
        ),
      );
    }

    const najnoviji = await db
      .select(KOLONE_PROIZVODA)
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(and(...uslovi))
      .orderBy(desc(products.createdAt))
      .limit(preostalo);

    odabraniProizvodi = [...odabraniProizvodi, ...najnoviji];
  }

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

/**
 * Isti fallback pattern kao `getIstaknutiProizvodi`: prvo partneri koje je
 * admin stvarno istakao (`brands.istaknut`), pa popuni razliku najnovijim
 * odobrenim partnerima koji već nisu u prvoj listi.
 */
async function getIstaknutiPartneri() {
  const istaknuti = await db
    .select(KOLONE_PARTNERA)
    .from(brands)
    .where(and(eq(brands.istaknut, true), eq(brands.status, 'odobren')))
    .orderBy(desc(brands.createdAt))
    .limit(BROJ_ISTAKNUTIH_PARTNERA);

  let odabraniPartneri = istaknuti;

  if (odabraniPartneri.length < BROJ_ISTAKNUTIH_PARTNERA) {
    const preostalo = BROJ_ISTAKNUTIH_PARTNERA - odabraniPartneri.length;
    const uslovi = [eq(brands.status, 'odobren')];
    if (odabraniPartneri.length > 0) {
      uslovi.push(
        notInArray(
          brands.id,
          odabraniPartneri.map((partner) => partner.id),
        ),
      );
    }

    const najnoviji = await db
      .select(KOLONE_PARTNERA)
      .from(brands)
      .where(and(...uslovi))
      .orderBy(desc(brands.createdAt))
      .limit(preostalo);

    odabraniPartneri = [...odabraniPartneri, ...najnoviji];
  }

  if (odabraniPartneri.length === 0) {
    return [];
  }

  const brojevi = await db
    .select({ brandId: products.brandId, ukupno: count() })
    .from(products)
    .where(
      and(
        inArray(
          products.brandId,
          odabraniPartneri.map((partner) => partner.id),
        ),
        eq(products.status, 'odobren'),
      ),
    )
    .groupBy(products.brandId);

  const brojPoBrendu = new Map(brojevi.map((red) => [red.brandId, red.ukupno]));

  return odabraniPartneri.map((partner) => ({
    ...partner,
    brojProizvoda: brojPoBrendu.get(partner.id) ?? 0,
  }));
}

export default async function HomePage() {
  const [kategorije, istaknutiProizvodi, istaknutiPartneri] = await Promise.all([
    getTopLevelCategoriesWithProducts(),
    getIstaknutiProizvodi(),
    getIstaknutiPartneri(),
  ]);

  return (
    <div className="flex flex-col">
      <section className="bg-[#16332A] px-4 py-16 text-[#F2F5ED] sm:px-6 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
            {bs.homepage.hero.naslov}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-[#F2F5ED]/85 sm:text-lg">
            {bs.homepage.hero.podnaslov}
          </p>
          <Link
            href="/vodic"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-[#F2F5ED] px-8 py-3 text-base font-medium text-[#16332A] transition-colors hover:bg-white"
          >
            {bs.homepage.hero.cta}
          </Link>
          <ul className="mt-6 flex flex-col items-center gap-1 text-sm text-[#F2F5ED]/75 sm:flex-row sm:gap-6">
            {bs.homepage.hero.mikroOznake.map((oznaka) => (
              <li key={oznaka} className="flex items-center gap-1.5">
                <span aria-hidden="true">✓</span>
                {oznaka}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">
            {bs.homepage.kategorije.naslov}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {kategorije.map((kategorija) => (
              <Link
                key={kategorija.id}
                href={`/shop?kategorija=${kategorija.slug}`}
                className="flex flex-col rounded-2xl bg-[#C7D6BA] p-5 transition-transform hover:-translate-y-0.5"
              >
                <CategoryIcon ime={kategorija.ikona} className="h-6 w-6 text-[#16332A]" />
                <span className="mt-3 text-base font-medium text-[#1C2B22]">
                  {kategorija.naziv}
                </span>
                {kategorija.opis ? (
                  <span className="mt-1 text-sm text-[#1C2B22]/70">{kategorija.opis}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">
            {bs.homepage.istaknutiProizvodi.naslov}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {istaknutiProizvodi.map((proizvod) => (
              <ProizvodKartica key={proizvod.id} proizvod={proizvod} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-6 py-2.5 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
            >
              {bs.homepage.istaknutiProizvodi.vidiSve}
            </Link>
          </div>
        </div>
      </section>

      {istaknutiPartneri.length > 0 ? (
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">
              {bs.homepage.istaknutiPartneri.naslov}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {istaknutiPartneri.map((partner) => (
                <PartnerKartica key={partner.id} partner={partner} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/partneri"
                className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-6 py-2.5 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
              >
                {bs.homepage.istaknutiPartneri.vidiSve}
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
