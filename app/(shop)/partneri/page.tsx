import type { Metadata } from 'next';
import { and, eq, inArray, count as sqlCount } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, products } from '@/lib/db/schema';
import {
  buildPartneriWhere,
  parsePartneriParams,
  sortPartnere,
  type PartneriFilteri,
  type PartneriSearchParams,
} from '@/lib/domain/partners-query';
import { bs } from '@/lib/i18n/bs';
import { PartnerKartica } from '../_components/PartnerKartica';
import { PartneriFilterBar } from './_components/PartneriFilterBar';

export const metadata: Metadata = {
  title: bs.partneri.naslov,
  description: bs.partneri.metaOpis,
};

type PartneriPageProps = {
  searchParams: Promise<PartneriSearchParams>;
};

async function getPartneri(filteri: PartneriFilteri) {
  const redovi = await db
    .select({
      id: brands.id,
      slug: brands.slug,
      naziv: brands.naziv,
      kratkiOpis: brands.kratkiOpis,
      logoUrl: brands.logoUrl,
      verifikovan: brands.verifikovan,
      istaknut: brands.istaknut,
      createdAt: brands.createdAt,
    })
    .from(brands)
    .where(buildPartneriWhere(filteri));

  if (redovi.length === 0) {
    return [];
  }

  const brojevi = await db
    .select({ brandId: products.brandId, ukupno: sqlCount() })
    .from(products)
    .where(
      and(
        inArray(
          products.brandId,
          redovi.map((red) => red.id),
        ),
        eq(products.status, 'odobren'),
      ),
    )
    .groupBy(products.brandId);

  const brojPoBrendu = new Map(brojevi.map((red) => [red.brandId, red.ukupno]));

  const spojeno = redovi.map((red) => ({
    ...red,
    brojProizvoda: brojPoBrendu.get(red.id) ?? 0,
  }));

  return sortPartnere(spojeno, filteri.sort);
}

export default async function PartneriPage({ searchParams }: PartneriPageProps) {
  const filteri = parsePartneriParams(await searchParams);
  const partneri = await getPartneri(filteri);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{bs.partneri.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/60">{bs.partneri.rezultati(partneri.length)}</p>
      </div>

      <div className="mt-6">
        <PartneriFilterBar filteri={filteri} />
      </div>

      {partneri.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="max-w-md text-base text-[#1C2B22]/70">{bs.partneri.prazno}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partneri.map((partner) => (
            <PartnerKartica key={partner.id} partner={partner} />
          ))}
        </div>
      )}
    </div>
  );
}
