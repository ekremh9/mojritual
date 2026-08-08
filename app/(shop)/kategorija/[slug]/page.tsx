import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, productCategories, productImages, products } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { ProizvodKartica } from '../../_components/ProizvodKartica';

type KategorijaPageProps = {
  params: Promise<{ slug: string }>;
};

const getKategorija = cache(async (slug: string) => {
  const redovi = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      naziv: categories.naziv,
      opis: categories.opis,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return redovi[0] ?? null;
});

async function getProizvodiKategorije(kategorijaId: string) {
  const odobreniProizvodi = await db
    .select({
      id: products.id,
      slug: products.slug,
      naziv: products.naziv,
      kratkiOpis: products.kratkiOpis,
      cijena: products.cijena,
    })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.productId, products.id))
    .where(and(eq(productCategories.categoryId, kategorijaId), eq(products.status, 'odobren')))
    .orderBy(desc(products.createdAt));

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

export async function generateMetadata({ params }: KategorijaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const kategorija = await getKategorija(slug);

  if (!kategorija) {
    return {};
  }

  return {
    title: kategorija.naziv,
    description: kategorija.opis ?? bs.kategorija.opisGenericki,
  };
}

export default async function KategorijaPage({ params }: KategorijaPageProps) {
  const { slug } = await params;
  const kategorija = await getKategorija(slug);

  if (!kategorija) {
    notFound();
  }

  const proizvodi = await getProizvodiKategorije(kategorija.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{kategorija.naziv}</h1>
        {kategorija.opis ? <p className="text-base text-[#1C2B22]/70">{kategorija.opis}</p> : null}
        <p className="text-sm text-[#1C2B22]/60">{bs.kategorija.brojProizvoda(proizvodi.length)}</p>
      </div>

      {proizvodi.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.kategorija.prazno}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
          >
            {bs.kategorija.nazadNaPocetnu}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {proizvodi.map((proizvod) => (
            <ProizvodKartica key={proizvod.id} proizvod={proizvod} />
          ))}
        </div>
      )}
    </div>
  );
}
