import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { Award, BadgeCheck } from 'lucide-react';
import { db } from '@/lib/db';
import { brandCertificates, brands, productImages, products } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { ProizvodKartica } from '../../_components/ProizvodKartica';

type BrendPageProps = {
  params: Promise<{ slug: string }>;
};

const getBrend = cache(async (slug: string) => {
  const redovi = await db
    .select({
      id: brands.id,
      slug: brands.slug,
      naziv: brands.naziv,
      kratkiOpis: brands.kratkiOpis,
      prica: brands.prica,
      logoUrl: brands.logoUrl,
      coverUrl: brands.coverUrl,
      verifikovan: brands.verifikovan,
    })
    .from(brands)
    .where(and(eq(brands.slug, slug), eq(brands.status, 'odobren')))
    .limit(1);

  return redovi[0] ?? null;
});

async function getCertifikatiBrenda(brandId: string) {
  return db
    .select({
      id: brandCertificates.id,
      naziv: brandCertificates.naziv,
      opis: brandCertificates.opis,
      dokumentUrl: brandCertificates.dokumentUrl,
    })
    .from(brandCertificates)
    .where(eq(brandCertificates.brandId, brandId))
    .orderBy(asc(brandCertificates.redoslijed));
}

async function getProizvodiBrenda(brandId: string) {
  const odobreniProizvodi = await db
    .select({
      id: products.id,
      slug: products.slug,
      naziv: products.naziv,
      kratkiOpis: products.kratkiOpis,
      cijena: products.cijena,
    })
    .from(products)
    .where(and(eq(products.brandId, brandId), eq(products.status, 'odobren')))
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

export async function generateMetadata({ params }: BrendPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brend = await getBrend(slug);

  if (!brend) {
    return {};
  }

  return {
    title: bs.partner.metaNaslov(brend.naziv),
    description: brend.kratkiOpis ?? undefined,
  };
}

export default async function BrendPage({ params }: BrendPageProps) {
  const { slug } = await params;
  const brend = await getBrend(slug);

  if (!brend) {
    notFound();
  }

  const [certifikati, proizvodi] = await Promise.all([
    getCertifikatiBrenda(brend.id),
    getProizvodiBrenda(brend.id),
  ]);

  const pasusiPrice = brend.prica?.split('\n\n').filter((pasus) => pasus.trim().length > 0) ?? [];

  return (
    <div className="flex flex-col">
      <div
        className="relative flex h-[240px] items-end overflow-hidden sm:h-[320px]"
        style={!brend.coverUrl ? { backgroundColor: '#16332A' } : undefined}
      >
        {brend.coverUrl ? (
          <>
            <Image src={brend.coverUrl} alt="" fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : null}

        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-end gap-4 px-4 pb-6 sm:px-6 sm:pb-8">
          {brend.logoUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#F2F5ED] bg-[#F2F5ED] sm:h-20 sm:w-20">
              <Image
                src={brend.logoUrl}
                alt={brend.naziv}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            {brend.verifikovan ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F2F5ED] px-2.5 py-1 text-xs font-medium text-[#16332A]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {bs.partner.verifikovan}
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold uppercase tracking-wide text-[#F2F5ED] sm:text-4xl">
              {brend.naziv}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        {pasusiPrice.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.partner.oPartneru}</h2>
            <div className="flex flex-col gap-3 text-sm leading-relaxed text-[#1C2B22]/80">
              {pasusiPrice.map((pasus, indeks) => (
                <p key={indeks}>{pasus}</p>
              ))}
            </div>
          </div>
        ) : null}

        {certifikati.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.partner.certifikati}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certifikati.map((certifikat) => (
                <div
                  key={certifikat.id}
                  className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-4"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 shrink-0 text-[#16332A]" aria-hidden="true" />
                    <span className="text-sm font-medium text-[#1C2B22]">{certifikat.naziv}</span>
                  </div>
                  {certifikat.opis ? (
                    <p className="text-sm text-[#1C2B22]/70">{certifikat.opis}</p>
                  ) : null}
                  {certifikat.dokumentUrl ? (
                    <a
                      href={certifikat.dokumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto text-sm font-medium text-[#16332A] underline underline-offset-2"
                    >
                      {bs.partner.pogledajDokument}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.partner.ponudaPartnera}</h2>
          {proizvodi.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
              <p className="text-base text-[#1C2B22]/70">{bs.partner.prazno}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {proizvodi.map((proizvod) => (
                <ProizvodKartica key={proizvod.id} proizvod={proizvod} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
