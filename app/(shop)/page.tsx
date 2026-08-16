import Link from 'next/link';
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, productImages, products } from '@/lib/db/schema';
import { getTopLevelCategoriesWithProducts } from '@/lib/domain/categories';
import { bs } from '@/lib/i18n/bs';
import { CategoryIcon } from './_components/CategoryIcon';
import { ProizvodKartica } from './_components/ProizvodKartica';

const BROJ_ISTAKNUTIH = 10;

const KOLONE_PROIZVODA = {
  id: products.id,
  slug: products.slug,
  naziv: products.naziv,
  kratkiOpis: products.kratkiOpis,
  cijena: products.cijena,
};

/**
 * Prvo proizvodi koje je admin stvarno istakao (`products.istaknut`,
 * odvojeno od zahtjeva brenda — vidi lib/db/schema/products.ts). Ako ih
 * ima manje od BROJ_ISTAKNUTIH, popuni razliku najnovijim odobrenim
 * proizvodima koji već nisu u prvoj listi, da homepage nikad ne izgleda
 * prazno dok admin ne istakne dovoljno proizvoda.
 */
async function getIstaknutiProizvodi() {
  const istaknuti = await db
    .select(KOLONE_PROIZVODA)
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(
      and(eq(products.istaknut, true), eq(products.status, 'odobren'), eq(brands.status, 'odobren')),
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

export default async function HomePage() {
  const [kategorije, istaknutiProizvodi] = await Promise.all([
    getTopLevelCategoriesWithProducts(),
    getIstaknutiProizvodi(),
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
        </div>
      </section>
    </div>
  );
}
