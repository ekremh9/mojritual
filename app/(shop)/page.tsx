import Link from 'next/link';
import { asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, productImages, products } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { ProizvodKartica } from './_components/ProizvodKartica';

async function getKategorije() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      naziv: categories.naziv,
      opis: categories.opis,
    })
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.redoslijed))
    .limit(5);
}

async function getIstaknutiProizvodi() {
  const odobreniProizvodi = await db
    .select({
      id: products.id,
      slug: products.slug,
      naziv: products.naziv,
      kratkiOpis: products.kratkiOpis,
      cijena: products.cijena,
    })
    .from(products)
    .where(eq(products.status, 'odobren'))
    .orderBy(desc(products.createdAt))
    .limit(5);

  if (odobreniProizvodi.length === 0) {
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
        odobreniProizvodi.map((proizvod) => proizvod.id),
      ),
    )
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  return odobreniProizvodi.map((proizvod) => ({
    ...proizvod,
    slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
  }));
}

export default async function HomePage() {
  const [kategorije, istaknutiProizvodi] = await Promise.all([
    getKategorije(),
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
                href={`/kategorija/${kategorija.slug}`}
                className="flex flex-col justify-between rounded-2xl bg-[#C7D6BA] p-5 transition-transform hover:-translate-y-0.5"
              >
                <span className="text-base font-medium text-[#1C2B22]">{kategorija.naziv}</span>
                {kategorija.opis ? (
                  <span className="mt-2 text-sm text-[#1C2B22]/70">{kategorija.opis}</span>
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
