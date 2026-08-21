import type { Metadata } from 'next';
import { getHeroImageUrl } from '@/lib/domain/site-settings';
import { bs } from '@/lib/i18n/bs';
import { HeroImageUpload } from './_components/HeroImageUpload';

export const metadata: Metadata = {
  title: bs.admin.postavke.naslov,
};

export default async function AdminPostavkePage() {
  const heroSlikaUrl = await getHeroImageUrl();
  const poruke = bs.admin.postavke;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{poruke.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.heroSlika.naslov}</h2>
          <p className="text-sm text-[#1C2B22]/70">{poruke.heroSlika.opis}</p>
        </div>

        <HeroImageUpload trenutniUrl={heroSlikaUrl} />
      </section>
    </div>
  );
}
