import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { formatCijena } from '@/lib/domain/format';
import {
  getBrandProductCounts,
  getBrandProducts,
  jeProizvodStatus,
  PRODUCT_STATUSI,
  type PortalProizvodBrojaci,
} from '@/lib/domain/portal-products';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { ProizvodAkcije } from './_components/ProizvodAkcije';

export const metadata: Metadata = {
  title: bs.portal.proizvodi.naslov,
};

type PortalProizvodiPageProps = {
  searchParams: Promise<{ status?: string; istaknuto?: string }>;
};

const STATUS_KLASE: Record<Product['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  odbijen: 'bg-[#B3261E]/10 text-[#B3261E]',
};

// 'nema_zahtjeva' namjerno izostavljen — ta ćelija se renderuje kao crtica,
// bez badge-a (vidi tabelu ispod).
const ISTAKNUT_KLASE: Record<Exclude<Product['istaknutStatus'], 'nema_zahtjeva'>, string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobreno: 'bg-[#16332A] text-[#F2F5ED]',
  odbijeno: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function proizvodiHref(status: Product['status'] | null): string {
  return status ? `/portal/proizvodi?status=${status}` : '/portal/proizvodi';
}

const ISTAKNUTO_HREF = '/portal/proizvodi?istaknuto=1';

function ukupnoBrojaca(brojaci: PortalProizvodBrojaci): number {
  return PRODUCT_STATUSI.reduce((zbir, status) => zbir + brojaci[status], 0);
}

export default async function PortalProizvodiPage({ searchParams }: PortalProizvodiPageProps) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  const { status: statusParam, istaknuto: istaknutoParam } = await searchParams;
  // Dvije nezavisne ose filtera dijele isti "koji je tab aktivan" prostor u
  // navigaciji, ali se ne kombinuju u jednom zahtjevu — klik na "Istaknuto"
  // ide na ?istaknuto=1 (bez ?status), klik na status tab ide na ?status=X
  // (bez ?istaknuto). Ako oba parametra nekako stignu istovremeno (ručno
  // uređen URL), isticanje ima prednost i status filter se ignoriše.
  const istaknutoFilter = istaknutoParam === '1';
  const statusFilter =
    !istaknutoFilter && statusParam && jeProizvodStatus(statusParam) ? statusParam : undefined;

  const [proizvodi, brojaci] = await Promise.all([
    getBrandProducts(pristup.brand.id, statusFilter, istaknutoFilter),
    getBrandProductCounts(pristup.brand.id),
  ]);

  const ukupno = ukupnoBrojaca(brojaci);

  const tabovi = [
    {
      href: proizvodiHref(null),
      aktivan: !istaknutoFilter && statusFilter === undefined,
      label: bs.portal.proizvodi.filteri.svi,
      broj: ukupno,
    },
    ...PRODUCT_STATUSI.map((status) => ({
      href: proizvodiHref(status),
      aktivan: !istaknutoFilter && statusFilter === status,
      label: bs.portal.proizvodi.status[status],
      broj: brojaci[status],
    })),
    {
      href: ISTAKNUTO_HREF,
      aktivan: istaknutoFilter,
      label: bs.portal.proizvodi.filteri.istaknuto,
      broj: brojaci.istaknuto,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.proizvodi.naslov}</h1>
        </div>
        <Link
          href="/portal/proizvodi/novi"
          className="shrink-0 rounded-full bg-[#16332A] px-4 py-2 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
        >
          {bs.portal.proizvodi.dodajProizvod}
        </Link>
      </div>

      {ukupno === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="max-w-md text-base text-[#1C2B22]/70">{bs.portal.proizvodi.prazno}</p>
          <Link
            href="/portal/proizvodi/novi"
            className="rounded-full bg-[#16332A] px-4 py-2 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
          >
            {bs.portal.proizvodi.dodajProizvod}
          </Link>
        </div>
      ) : (
        <>
          <nav
            aria-label={bs.portal.proizvodi.naslov}
            className="flex gap-1 overflow-x-auto pb-1"
          >
            {tabovi.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  tab.aktivan
                    ? 'bg-[#16332A] text-[#F2F5ED]'
                    : 'bg-white text-[#1C2B22]/70 hover:bg-[#F2F5ED]'
                }`}
              >
                {tab.label} ({tab.broj})
              </Link>
            ))}
          </nav>

          {proizvodi.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-12 text-center">
              <p className="text-sm text-[#1C2B22]/70">{bs.portal.proizvodi.praznoFilter}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.slika}</th>
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.naziv}</th>
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.kategorija}</th>
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.cijena}</th>
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.status}</th>
                    <th className="px-4 py-3">{bs.portal.proizvodi.tabela.isticanje}</th>
                    <th className="px-4 py-3 text-right">{bs.portal.proizvodi.tabela.akcije}</th>
                  </tr>
                </thead>
                <tbody>
                  {proizvodi.map((proizvod) => (
                    <tr key={proizvod.id} className="border-b border-[#1C2B22]/10 last:border-0">
                      <td className="px-4 py-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#1C2B22]/10 bg-[#F2F5ED]">
                          {proizvod.slika ? (
                            <Image
                              src={proizvod.slika.url}
                              alt={proizvod.slika.alt ?? proizvod.naziv}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/portal/proizvodi/${proizvod.id}`}
                          className="font-medium text-[#1C2B22] hover:underline"
                        >
                          {proizvod.naziv}
                        </Link>
                        {proizvod.status === 'odbijen' && proizvod.razlogOdbijanja ? (
                          <p className="mt-0.5 text-xs text-[#B3261E]">
                            {proizvod.razlogOdbijanja}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">
                        {proizvod.kategorija?.naziv ?? bs.portal.proizvodi.bezKategorije}
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]">{formatCijena(proizvod.cijena)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[proizvod.status]}`}
                        >
                          {bs.portal.proizvodi.status[proizvod.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {proizvod.istaknutStatus === 'nema_zahtjeva' ? (
                          <span className="text-[#1C2B22]/40">{bs.portal.proizvodi.nemaPodatka}</span>
                        ) : (
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ISTAKNUT_KLASE[proizvod.istaknutStatus]}`}
                          >
                            {bs.portal.proizvodi.istaknutStatus[proizvod.istaknutStatus]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ProizvodAkcije
                          productId={proizvod.id}
                          status={proizvod.status}
                          onemoguceno={pristup.brand.status === 'suspendovan'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
