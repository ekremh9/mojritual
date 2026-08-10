import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getPendingProducts } from '@/lib/domain/admin-products';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.proizvodi.naslov,
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

export default async function AdminProizvodiPage() {
  const proizvodi = await getPendingProducts();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.admin.proizvodi.naslov}</h1>

      {proizvodi.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{bs.admin.proizvodi.prazno}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{bs.admin.proizvodi.tabela.slika}</th>
                <th className="px-4 py-3">{bs.admin.proizvodi.tabela.naziv}</th>
                <th className="px-4 py-3">{bs.admin.proizvodi.tabela.brend}</th>
                <th className="px-4 py-3">{bs.admin.proizvodi.tabela.kategorija}</th>
                <th className="px-4 py-3">{bs.admin.proizvodi.tabela.cijena}</th>
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
                  <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(proizvod.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
