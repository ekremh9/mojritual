import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BRAND_STATUSI,
  getBrandsByStatus,
  getBrandStatusCounts,
  jeBrandStatus,
  type AdminBrendBrojaci,
} from '@/lib/domain/admin-brands';
import type { Brand } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.brendovi.naslov,
};

type AdminBrendoviPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const STATUS_KLASE: Record<Brand['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  suspendovan: 'bg-[#8A9086]/30 text-[#1C2B22]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

function brendoviHref(status: Brand['status'] | null): string {
  return status ? `/admin/brendovi?status=${status}` : '/admin/brendovi';
}

function ukupnoBrojaca(brojaci: AdminBrendBrojaci): number {
  return BRAND_STATUSI.reduce((zbir, status) => zbir + brojaci[status], 0);
}

export default async function AdminBrendoviPage({ searchParams }: AdminBrendoviPageProps) {
  const { status: statusParam } = await searchParams;
  const statusFilter = statusParam && jeBrandStatus(statusParam) ? statusParam : undefined;

  const [brendovi, brojaci] = await Promise.all([
    getBrandsByStatus(statusFilter),
    getBrandStatusCounts(),
  ]);

  const ukupno = ukupnoBrojaca(brojaci);

  const tabovi = [
    { status: null, label: bs.admin.brendovi.filteri.svi, broj: ukupno },
    ...BRAND_STATUSI.map((status) => ({
      status,
      label: bs.admin.brendovi.status[status],
      broj: brojaci[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.brendovi.naslov}</h1>

      {ukupno === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.admin.brendovi.prazno}</p>
        </div>
      ) : (
        <>
          <nav
            aria-label={bs.admin.brendovi.naslov}
            className="flex gap-1 overflow-x-auto pb-1"
          >
            {tabovi.map((tab) => {
              const aktivan = tab.status === (statusFilter ?? null);
              return (
                <Link
                  key={tab.status ?? 'svi'}
                  href={brendoviHref(tab.status)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    aktivan
                      ? 'bg-[#16332A] text-[#F2F5ED]'
                      : 'bg-white text-[#1C2B22]/70 hover:bg-[#F2F5ED]'
                  }`}
                >
                  {tab.label} ({tab.broj})
                </Link>
              );
            })}
          </nav>

          {brendovi.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-12 text-center">
              <p className="text-sm text-[#1C2B22]/70">{bs.admin.brendovi.praznoFilter}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                    <th className="px-4 py-3">{bs.admin.brendovi.tabela.naziv}</th>
                    <th className="px-4 py-3">{bs.admin.brendovi.tabela.email}</th>
                    <th className="px-4 py-3">{bs.admin.brendovi.tabela.status}</th>
                    <th className="px-4 py-3">{bs.admin.brendovi.tabela.datumRegistracije}</th>
                  </tr>
                </thead>
                <tbody>
                  {brendovi.map((brend) => (
                    <tr key={brend.id} className="border-b border-[#1C2B22]/10 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/brendovi/${brend.id}`}
                          className="font-medium text-[#1C2B22] hover:underline"
                        >
                          {brend.naziv}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">
                        {brend.email ?? bs.admin.brendovi.detalj.nemaPodatka}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[brend.status]}`}
                        >
                          {bs.admin.brendovi.status[brend.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(brend.createdAt)}</td>
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
