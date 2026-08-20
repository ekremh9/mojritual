import type { Metadata } from 'next';
import { getFeaturingPlans } from '@/lib/domain/admin-featuring';
import { bs } from '@/lib/i18n/bs';
import { FeaturingPlansSection } from './_components/FeaturingPlansSection';

export const metadata: Metadata = {
  title: bs.admin.cjenovnik.naslov,
};

export default async function AdminCjenovnikPage() {
  const poruke = bs.admin.cjenovnik;
  const [proizvodPlanovi, brendPlanovi] = await Promise.all([
    getFeaturingPlans('proizvod'),
    getFeaturingPlans('brend'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      <FeaturingPlansSection tip="proizvod" naslov={poruke.sekcijaProizvodi} planovi={proizvodPlanovi} />

      <FeaturingPlansSection tip="brend" naslov={poruke.sekcijaPartneri} planovi={brendPlanovi} />
    </div>
  );
}
