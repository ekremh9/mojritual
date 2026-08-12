import type { Metadata } from 'next';
import Link from 'next/link';
import { getGoalsOverview } from '@/lib/domain/admin-guide';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.vodic.naslov,
};

export default async function AdminVodicPage() {
  const ciljevi = await getGoalsOverview();
  const poruke = bs.admin.vodic;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      {ciljevi.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.pregled.prazno}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{poruke.pregled.tabela.cilj}</th>
                <th className="px-4 py-3">{poruke.pregled.tabela.proizvoda}</th>
                <th className="px-4 py-3">{poruke.pregled.tabela.tekstObjasnjenja}</th>
              </tr>
            </thead>
            <tbody>
              {ciljevi.map((cilj) => (
                <tr key={cilj.id} className="border-b border-[#1C2B22]/10 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/vodic/${cilj.id}`}
                      className="font-medium text-[#1C2B22] hover:underline"
                    >
                      {cilj.naziv}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{cilj.brojProizvoda}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        cilj.imaAktivanTekst
                          ? 'bg-[#16332A] text-[#F2F5ED]'
                          : 'bg-[#8A9086]/15 text-[#1C2B22]/70'
                      }`}
                    >
                      {cilj.imaAktivanTekst ? poruke.pregled.tekstDa : poruke.pregled.tekstNe}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
