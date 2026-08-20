import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  getPendingFeaturedCount,
  getProductsByStatus,
  getProductStatusCounts,
  jeProizvodStatus,
  PRODUCT_STATUSI,
  type AdminProizvodBrojaci,
} from '@/lib/domain/admin-products';
import { formatCijena } from '@/lib/domain/format';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.proizvodi.naslov,
};

type AdminProizvodiPageProps = {
  searchParams: Promise<{ status?: string; istaknutoStatus?: string }>;
};

const STATUS_KLASE: Record<Product['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  odbijen: 'bg-[#B3261E]/10 text-[#B3261E]',
};

// 'nema_zahtjeva' namjerno izostavljen — ta ćelija se renderuje kao crtica,
// bez badge-a (vidi tabelu ispod). Identično app/portal/proizvodi/page.tsx —
// duplirano na istom nivou kao STATUS_KLASE iznad (obje strane već drže
// svoju kopiju te mape), umjesto izdvajanja u zajedničku funkciju.
const ISTAKNUT_KLASE: Record<Exclude<Product['istaknutStatus'], 'nema_zahtjeva'>, string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobreno: 'bg-[#16332A] text-[#F2F5ED]',
  odbijeno: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

function proizvodiHref(status: Product['status'] | null): string {
  return status ? `/admin/proizvodi?status=${status}` : '/admin/proizvodi';
}

const ZAHTJEVI_ISTICANJA_HREF = '/admin/proizvodi?istaknutoStatus=na_cekanju';

function ukupnoBrojaca(brojaci: AdminProizvodBrojaci): number {
  return PRODUCT_STATUSI.reduce((zbir, status) => zbir + brojaci[status], 0);
}

export default async function AdminProizvodiPage({ searchParams }: AdminProizvodiPageProps) {
  const { status: statusParam, istaknutoStatus: istaknutoStatusParam } = await searchParams;
  // Isti obrazac kao portal (vidi app/portal/proizvodi/page.tsx): dvije
  // nezavisne ose filtera dijele tab prostor, ne kombinuju se u jednom
  // zahtjevu. Zahtjev za isticanje može stići na proizvodu bilo kojeg
  // statusa, pa kad je ovaj tab aktivan status filter se ignoriše.
  const zahtjeviIsticanjaFilter = istaknutoStatusParam === 'na_cekanju';
  const statusFilter =
    !zahtjeviIsticanjaFilter && statusParam && jeProizvodStatus(statusParam)
      ? statusParam
      : undefined;

  const [proizvodi, brojaci, brojZahtjevaIsticanja] = await Promise.all([
    getProductsByStatus(statusFilter, zahtjeviIsticanjaFilter ? 'na_cekanju' : undefined),
    getProductStatusCounts(),
    getPendingFeaturedCount(),
  ]);

  const ukupno = ukupnoBrojaca(brojaci);

  const tabovi = [
    {
      href: proizvodiHref(null),
      aktivan: !zahtjeviIsticanjaFilter && statusFilter === undefined,
      label: bs.admin.proizvodi.filteri.svi,
      broj: ukupno,
    },
    ...PRODUCT_STATUSI.map((status) => ({
      href: proizvodiHref(status),
      aktivan: !zahtjeviIsticanjaFilter && statusFilter === status,
      label: bs.admin.proizvodi.status[status],
      broj: brojaci[status],
    })),
    {
      href: ZAHTJEVI_ISTICANJA_HREF,
      aktivan: zahtjeviIsticanjaFilter,
      label: bs.admin.proizvodi.filteri.zahtjeviIsticanja,
      broj: brojZahtjevaIsticanja,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.proizvodi.naslov}</h1>

      {ukupno === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.admin.proizvodi.prazno}</p>
        </div>
      ) : (
        <>
          <nav
            aria-label={bs.admin.proizvodi.naslov}
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
              <p className="text-sm text-[#1C2B22]/70">{bs.admin.proizvodi.praznoFilter}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.slika}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.naziv}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.brend}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.kategorija}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.cijena}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.status}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.isticanje}</th>
                    <th className="px-4 py-3">{bs.admin.proizvodi.tabela.poslano}</th>
                  </tr>
                </thead>
                <tbody>
                  {proizvodi.map((proizvod) => (
                    <tr key={proizvod.id} className="border-b border-[#1C2B22]/10 last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/proizvodi/${proizvod.id}`}>
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
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/proizvodi/${proizvod.id}`}
                          className="font-medium text-[#1C2B22] hover:underline"
                        >
                          {proizvod.naziv}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">{proizvod.brend.naziv}</td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">
                        {proizvod.kategorija?.naziv ?? bs.admin.proizvodi.bezKategorije}
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]">{formatCijena(proizvod.cijena)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[proizvod.status]}`}
                        >
                          {bs.admin.proizvodi.status[proizvod.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {proizvod.istaknutStatus === 'nema_zahtjeva' ? (
                          <span className="text-[#1C2B22]/40">{bs.admin.proizvodi.nemaPodatka}</span>
                        ) : (
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ISTAKNUT_KLASE[proizvod.istaknutStatus]}`}
                          >
                            {bs.admin.proizvodi.istaknutStatus[proizvod.istaknutStatus]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(proizvod.createdAt)}</td>
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
