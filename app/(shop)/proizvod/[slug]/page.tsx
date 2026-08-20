import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  brands,
  categories,
  productCategories,
  productImages,
  products,
  wholesalePriceTiers,
} from '@/lib/db/schema';
import { jeOdobreniPartner } from '@/lib/domain/brand-access';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';
import { DodajUKorpuDugme } from './_components/DodajUKorpuDugme';
import { ProizvodGalerija } from './_components/ProizvodGalerija';

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
    .where(
      and(
        eq(products.slug, slug),
        eq(products.status, 'odobren'),
        eq(brands.status, 'odobren'),
      ),
    )
    .limit(1);

  const proizvod = redovi[0];
  if (!proizvod) {
    return null;
  }

  const [slike, kategorijeProizvoda, wholesalePragoviRedovi] = await Promise.all([
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
    db
      .select({
        minKolicina: wholesalePriceTiers.minKolicina,
        popustPosto: wholesalePriceTiers.popustPosto,
      })
      .from(wholesalePriceTiers)
      .where(eq(wholesalePriceTiers.productId, proizvod.id))
      .orderBy(asc(wholesalePriceTiers.minKolicina)),
  ]);

  const wholesalePragovi = wholesalePragoviRedovi.map((prag) => ({
    minKolicina: prag.minKolicina,
    popustPosto: Number(prag.popustPosto),
  }));

  return { ...proizvod, slike, kategorijeProizvoda, wholesalePragovi };
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

  const session = await auth();
  const jePartner = session?.user?.id ? await jeOdobreniPartner(session.user.id) : false;

  const pasusiOpisa = proizvod.opis?.split('\n\n').filter((pasus) => pasus.trim().length > 0) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:py-12">
      <div className="lg:w-1/2 lg:min-w-0">
        <ProizvodGalerija slike={proizvod.slike} naziv={proizvod.naziv} />
      </div>

      <div className="flex flex-col gap-6 lg:w-1/2 lg:min-w-0">
        <div className="flex flex-col gap-4">
          {proizvod.kategorijeProizvoda.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {proizvod.kategorijeProizvoda.map((kategorija) => (
                <Link
                  key={kategorija.slug}
                  href={`/shop?kategorija=${kategorija.slug}`}
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
              href={`/partner/${proizvod.brandSlug}`}
              className="font-medium text-[#1C2B22] underline underline-offset-2"
            >
              {proizvod.brandNaziv}
            </Link>
          </span>

          <DodajUKorpuDugme
            productId={proizvod.id}
            cijena={proizvod.cijena}
            jePartner={jePartner}
            pragovi={proizvod.wholesalePragovi}
          />
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
