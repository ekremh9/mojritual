import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getOrdersOverview,
  getOrderStatusCounts,
  jeOrderStatus,
  ORDER_STATUSI,
  type AdminNarudzbaBrojaci,
} from '@/lib/domain/admin-orders';
import { formatCijena } from '@/lib/domain/format';
import type { Order } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.narudzbe.naslov,
};

type AdminNarudzbePageProps = {
  searchParams: Promise<{ status?: string }>;
};

const STATUS_KLASE: Record<Order['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  potvrdjeno: 'bg-[#C7D6BA] text-[#1C2B22]',
  djelimicno_poslano: 'bg-[#C7D6BA] text-[#1C2B22]',
  poslano: 'bg-[#16332A]/10 text-[#16332A]',
  isporuceno: 'bg-[#16332A] text-[#F2F5ED]',
  otkazano: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function narudzbeHref(status: Order['status'] | null): string {
  return status ? `/admin/narudzbe?status=${status}` : '/admin/narudzbe';
}

function ukupnoBrojaca(brojaci: AdminNarudzbaBrojaci): number {
  return ORDER_STATUSI.reduce((zbir, status) => zbir + brojaci[status], 0);
}

export default async function AdminNarudzbePage({ searchParams }: AdminNarudzbePageProps) {
  const { status: statusParam } = await searchParams;
  const statusFilter = statusParam && jeOrderStatus(statusParam) ? statusParam : undefined;

  const [narudzbe, brojaci] = await Promise.all([
    getOrdersOverview(statusFilter),
    getOrderStatusCounts(),
  ]);

  const ukupno = ukupnoBrojaca(brojaci);

  const tabovi = [
    { status: null, label: bs.admin.narudzbe.filteri.svi, broj: ukupno },
    ...ORDER_STATUSI.map((status) => ({
      status,
      label: bs.admin.narudzbe.status[status],
      broj: brojaci[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.narudzbe.naslov}</h1>

      {ukupno === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.admin.narudzbe.prazno}</p>
        </div>
      ) : (
        <>
          <nav aria-label={bs.admin.narudzbe.naslov} className="flex gap-1 overflow-x-auto pb-1">
            {tabovi.map((tab) => {
              const aktivan = tab.status === (statusFilter ?? null);
              return (
                <Link
                  key={tab.status ?? 'sve'}
                  href={narudzbeHref(tab.status)}
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

          {narudzbe.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-12 text-center">
              <p className="text-sm text-[#1C2B22]/70">{bs.admin.narudzbe.praznoFilter}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.broj}</th>
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.datum}</th>
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.kupac}</th>
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.ukupno}</th>
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.status}</th>
                    <th className="px-4 py-3">{bs.admin.narudzbe.tabela.posiljki}</th>
                  </tr>
                </thead>
                <tbody>
                  {narudzbe.map((narudzba) => (
                    <tr key={narudzba.id} className="border-b border-[#1C2B22]/10 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/narudzbe/${narudzba.id}`}
                          className="font-medium text-[#1C2B22] hover:underline"
                        >
                          {narudzba.broj}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(narudzba.createdAt)}</td>
                      <td className="px-4 py-3 text-[#1C2B22]">{narudzba.kupacIme}</td>
                      <td className="px-4 py-3 text-[#1C2B22]">{formatCijena(narudzba.ukupno)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[narudzba.status]}`}
                        >
                          {bs.admin.narudzbe.status[narudzba.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#1C2B22]/70">{narudzba.brojPosiljki}</td>
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
