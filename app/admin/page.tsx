import type { Metadata } from 'next';
import Link from 'next/link';
import { getBrandApprovalStats } from '@/lib/domain/admin-brands';
import { getPendingFeaturedCount, getProductApprovalStats } from '@/lib/domain/admin-products';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.dashboard.naslov,
};

export default async function AdminPage() {
  const [proizvodi, brendovi, zahtjeviIsticanja] = await Promise.all([
    getProductApprovalStats(),
    getBrandApprovalStats(),
    getPendingFeaturedCount(),
  ]);

  const statistike = [
    { label: bs.admin.dashboard.proizvodaNaCekanju, broj: proizvodi.naCekanju },
    { label: bs.admin.dashboard.brendovaNaCekanju, broj: brendovi.naCekanju },
    { label: bs.admin.dashboard.odobrenihBrendova, broj: brendovi.odobreno },
    { label: bs.admin.dashboard.odobrenihProizvoda, broj: proizvodi.odobreno },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.dashboard.naslov}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statistike.map((stavka) => (
          <div
            key={stavka.label}
            className="flex flex-col gap-1 rounded-2xl border border-[#1C2B22]/10 bg-white p-4"
          >
            <span className="text-2xl font-semibold text-[#1C2B22]">{stavka.broj}</span>
            <span className="text-sm text-[#1C2B22]/70">{stavka.label}</span>
          </div>
        ))}
        <Link
          href="/admin/proizvodi?istaknutoStatus=na_cekanju"
          className="flex flex-col gap-1 rounded-2xl border border-[#1C2B22]/10 bg-white p-4 transition-colors hover:bg-[#F2F5ED]"
        >
          <span className="text-2xl font-semibold text-[#1C2B22]">{zahtjeviIsticanja}</span>
          <span className="text-sm text-[#1C2B22]/70">
            {bs.admin.dashboard.zahtjeviIsticanjaNaCekanju}
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.admin.dashboard.brziLinkovi}</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/proizvodi"
            className="rounded-full bg-[#16332A] px-4 py-2 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
          >
            {bs.admin.dashboard.pogledajProizvode}
          </Link>
          <Link
            href="/admin/brendovi"
            className="rounded-full border border-[#1C2B22]/20 px-4 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED]"
          >
            {bs.admin.dashboard.pogledajBrendove}
          </Link>
        </div>
      </div>
    </div>
  );
}
