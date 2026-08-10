import type { Metadata } from 'next';
import Link from 'next/link';
import { getPendingBrands } from '@/lib/domain/admin-brands';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.brendovi.naslov,
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

export default async function AdminBrendoviPage() {
  const brendovi = await getPendingBrands();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.brendovi.naslov}</h1>

      {brendovi.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.admin.brendovi.prazno}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{bs.admin.brendovi.tabela.naziv}</th>
                <th className="px-4 py-3">{bs.admin.brendovi.tabela.email}</th>
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
                  <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(brend.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
