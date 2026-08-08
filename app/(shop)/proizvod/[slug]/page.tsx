import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, categories, productCategories, productImages, products } from '@/lib/db/schema';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

type ProizvodPageProps = {
  params: Promise<{ slug: string }>;
};

const getProizvod = cache(async (slug: string) => {
  const redovi = await db
    .select({
      id: products.id,
      slug: products.slug,
      naziv: products.naziv,
      kratkiOpis: products.kratkiOpis,
      opis: products.opis,
      doziranje: products.doziranje,
      upozorenja: products.upozorenja,
      cijena: products.cijena,
      brandSlug: brands.slug,
      brandNaziv: brands.naziv,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(and(eq(products.slug, slug), eq(products.status, 'odobren')))
    .limit(1);

  const proizvod = redovi[0];
  if (!proizvod) {
    return null;
  }

  const [slike, kategorijeProizvoda] = await Promise.all([
    db
      .select({ url: productImages.url, alt: productImages.alt })
      .from(productImages)
      .where(eq(productImages.productId, proizvod.id))
      .orderBy(asc(productImages.redoslijed)),
    db
      .select({ slug: categories.slug, naziv: categories.naziv })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, proizvod.id)),
  ]);

  return { ...proizvod, slike, kategorijeProizvoda };
});

export async function generateMetadata({ params }: ProizvodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const proizvod = await getProizvod(slug);

  if (!proizvod) {
    return {};
  }

  return {
    title: proizvod.naziv,
    description: proizvod.kratkiOpis ?? undefined,
  };
}

export default async function ProizvodPage({ params }: ProizvodPageProps) {
  const { slug } = await params;
  const proizvod = await getProizvod(slug);

  if (!proizvod) {
    notFound();
  }

  const glavnaSlika = proizvod.slike[0] ?? null;
  const ostaleSlike = proizvod.slike.slice(1);
  const pasusiOpisa = proizvod.opis?.split('\n\n').filter((pasus) => pasus.trim().length > 0) ?? [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:py-12">
      <div className="lg:w-1/2">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F2F5ED]">
          {glavnaSlika ? (
            <Image
              src={glavnaSlika.url}
              alt={glavnaSlika.alt ?? proizvod.naziv}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        {ostaleSlike.length > 0 ? (
          <div className="mt-3 flex gap-3">
            {ostaleSlike.map((slika) => (
              <div
                key={slika.url}
                className="relative aspect-square w-20 overflow-hidden rounded-xl bg-[#F2F5ED]"
              >
                <Image
                  src={slika.url}
                  alt={slika.alt ?? proizvod.naziv}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:w-1/2">
        <div className="flex flex-col gap-4">
          {proizvod.kategorijeProizvoda.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {proizvod.kategorijeProizvoda.map((kategorija) => (
                <Link
                  key={kategorija.slug}
                  href={`/kategorija/${kategorija.slug}`}
                  className="rounded-full bg-[#C7D6BA] px-3 py-1 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-[#C7D6BA]/70"
                >
                  {kategorija.naziv}
                </Link>
              ))}
            </div>
          ) : null}

          <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{proizvod.naziv}</h1>

          {proizvod.kratkiOpis ? (
            <p className="text-base text-[#1C2B22]/70">{proizvod.kratkiOpis}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-y border-[#1C2B22]/10 py-5">
          <span className="text-2xl font-semibold text-[#1C2B22]">
            {formatCijena(proizvod.cijena)}
          </span>

          <span className="text-sm text-[#1C2B22]/70">
            {bs.proizvod.prodaje}:{' '}
            <Link
              href={`/brend/${proizvod.brandSlug}`}
              className="font-medium text-[#1C2B22] underline underline-offset-2"
            >
              {proizvod.brandNaziv}
            </Link>
          </span>

          <button
            type="button"
            disabled
            className="mt-1 inline-flex items-center justify-center rounded-full bg-[#16332A] px-8 py-3 text-base font-medium text-[#F2F5ED] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bs.proizvod.dodajUKorpu}
          </button>
        </div>

        {pasusiOpisa.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.proizvod.opis}</h2>
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#1C2B22]/80">
              {pasusiOpisa.map((pasus, indeks) => (
                <p key={indeks}>{pasus}</p>
              ))}
            </div>
          </div>
        ) : null}

        {proizvod.doziranje ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#1C2B22]">
              {bs.proizvod.sastojciIDoziranje}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C2B22]/80">
              {proizvod.doziranje}
            </p>
          </div>
        ) : null}

        {proizvod.upozorenja ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-[#C7D6BA]/40 p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#1C2B22]">
              <span aria-hidden="true">⚠️</span>
              {bs.proizvod.upozorenja}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#1C2B22]/80">
              {proizvod.upozorenja}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
