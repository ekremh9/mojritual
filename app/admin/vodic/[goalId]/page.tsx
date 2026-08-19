import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getGoalDetail } from '@/lib/domain/admin-guide';
import { bs } from '@/lib/i18n/bs';
import { ExplanationForm } from '../_components/ExplanationForm';
import { GuideOptionsSection } from '../_components/GuideOptionsSection';
import { ProductGoalRow } from '../_components/ProductGoalRow';

type AdminVodicCiljPageProps = {
  params: Promise<{ goalId: string }>;
};

export async function generateMetadata({ params }: AdminVodicCiljPageProps): Promise<Metadata> {
  const { goalId } = await params;
  const cilj = await getGoalDetail(goalId);

  return { title: cilj?.naziv ?? bs.admin.vodic.naslov };
}

export default async function AdminVodicCiljPage({ params }: AdminVodicCiljPageProps) {
  const { goalId } = await params;
  const cilj = await getGoalDetail(goalId);

  if (!cilj) {
    notFound();
  }

  const poruke = bs.admin.vodic.detalj;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/vodic"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#1C2B22]/70 hover:text-[#1C2B22]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {poruke.nazad}
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22] sm:text-3xl">{cilj.naziv}</h1>
        {cilj.opis ? <p className="text-sm text-[#1C2B22]/70">{cilj.opis}</p> : null}
      </div>

      <ExplanationForm goalId={cilj.id} pocetniTekst={cilj.aktivanTekst?.tekst ?? ''} />

      <GuideOptionsSection goalId={cilj.id} opcije={cilj.opcije} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.proizvodi.naslov}</h2>
          <p className="text-sm text-[#1C2B22]/70">{poruke.proizvodi.podnaslov}</p>
        </div>

        {cilj.proizvodi.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#C7D6BA]/30 px-6 py-16 text-center">
            <p className="text-base text-[#1C2B22]/70">{poruke.proizvodi.prazno}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#1C2B22]/10 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.slika}</th>
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.naziv}</th>
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.brend}</th>
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.relevantnost}</th>
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.oznaka}</th>
                  <th className="px-4 py-3">{poruke.proizvodi.tabela.akcija}</th>
                </tr>
              </thead>
              <tbody>
                {cilj.proizvodi.map((proizvod) => (
                  <ProductGoalRow
                    key={proizvod.id}
                    productId={proizvod.id}
                    goalId={cilj.id}
                    naziv={proizvod.naziv}
                    brendNaziv={proizvod.brend.naziv}
                    slika={proizvod.slika}
                    pocetnoVezan={proizvod.vezan}
                    pocetnaRelevantnost={proizvod.relevantnost}
                    pocetnaOznaka={proizvod.oznaka}
                    predlozioPartner={proizvod.predlozioPartner}
                    istaknutStatus={proizvod.istaknutStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
