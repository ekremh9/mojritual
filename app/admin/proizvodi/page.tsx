import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import {
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
  searchParams: Promise<{ status?: string }>;
};

const STATUS_KLASE: Record<Product['status'], string> = {
  nacrt: 'bg-[#8A9086]/15 text-[#1C2B22]/70',
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  odbijen: 'bg-[#B3261E]/10 text-[#B3261E]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

function proizvodiHref(status: Product['status'] | null): string {
  return status ? `/admin/proizvodi?status=${status}` : '/admin/proizvodi';
}

function ukupnoBrojaca(brojaci: AdminProizvodBrojaci): number {
  return PRODUCT_STATUSI.reduce((zbir, status) => zbir + brojaci[status], 0);
}

export default async function AdminProizvodiPage({ searchParams }: AdminProizvodiPageProps) {
  const { status: statusParam } = await searchParams;
  const statusFilter = statusParam && jeProizvodStatus(statusParam) ? statusParam : undefined;

  const [proizvodi, brojaci] = await Promise.all([
    getProductsByStatus(statusFilter),
    getProductStatusCounts(),
  ]);

  const ukupno = ukupnoBrojaca(brojaci);

  const tabovi = [
    { status: null, label: bs.admin.proizvodi.filteri.svi, broj: ukupno },
    ...PRODUCT_STATUSI.map((status) => ({
      status,
      label: bs.admin.proizvodi.status[status],
      broj: brojaci[status],
    })),
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
            {tabovi.map((tab) => {
              const aktivan = tab.status === (statusFilter ?? null);
              return (
                <Link
                  key={tab.status ?? 'svi'}
                  href={proizvodiHref(tab.status)}
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/proizvodi/${proizvod.id}`}
                            className="font-medium text-[#1C2B22] hover:underline"
                          >
                            {proizvod.naziv}
                          </Link>
                          {proizvod.istaknutZahtjev ? (
                            <span
                              title={bs.admin.proizvodi.trazIsticanje}
                              aria-label={bs.admin.proizvodi.trazIsticanje}
                              className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-100 p-1 text-amber-700"
                            >
                              <Star className="h-3 w-3" aria-hidden="true" />
                            </span>
                          ) : null}
                        </div>
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
