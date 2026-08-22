import type { Metadata } from 'next';
import { getAllUsers } from '@/lib/domain/admin-users';
import type { Brand } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export const metadata: Metadata = {
  title: bs.admin.korisnici.naslov,
};

const STATUS_KLASE: Record<Brand['status'], string> = {
  na_cekanju: 'bg-amber-100 text-amber-800',
  odobren: 'bg-[#16332A] text-[#F2F5ED]',
  suspendovan: 'bg-[#8A9086]/30 text-[#1C2B22]',
};

function formatDatum(datum: Date): string {
  return datum.toLocaleDateString('bs-BA');
}

export default async function AdminKorisniciPage() {
  const korisnici = await getAllUsers();
  const poruke = bs.admin.korisnici;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>

      {korisnici.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
          <p className="text-base text-[#1C2B22]/70">{poruke.prazno}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{poruke.tabela.ime}</th>
                <th className="px-4 py-3">{poruke.tabela.email}</th>
                <th className="px-4 py-3">{poruke.tabela.rola}</th>
                <th className="px-4 py-3">{poruke.tabela.datumRegistracije}</th>
                <th className="px-4 py-3">{poruke.tabela.brojNarudzbi}</th>
                <th className="px-4 py-3">{poruke.tabela.partner}</th>
              </tr>
            </thead>
            <tbody>
              {korisnici.map((korisnik) => (
                <tr key={korisnik.id} className="border-b border-[#1C2B22]/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-[#1C2B22]">
                    {korisnik.ime ?? poruke.nemaPodatka}
                  </td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{korisnik.email}</td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{poruke.rola[korisnik.role]}</td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{formatDatum(korisnik.createdAt)}</td>
                  <td className="px-4 py-3 text-[#1C2B22]/70">{korisnik.brojNarudzbi}</td>
                  <td className="px-4 py-3">
                    {korisnik.partner ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[#1C2B22]">{korisnik.partner.naziv}</span>
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_KLASE[korisnik.partner.status]}`}
                        >
                          {bs.admin.brendovi.status[korisnik.partner.status]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#1C2B22]/50">{poruke.nemaPodatka}</span>
                    )}
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
