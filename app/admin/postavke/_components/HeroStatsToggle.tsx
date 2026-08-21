'use client';

import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setShowHeroStats } from '@/lib/domain/site-settings';
import { bs } from '@/lib/i18n/bs';

type HeroStatsToggleProps = {
  trenutnaVrijednost: boolean;
};

/** Uključuje/isključuje statistike u hero sekciji homepagea — isti obrazac kao `HeroImageUpload` (optimistički lokalni state, server action, router.refresh). */
export function HeroStatsToggle({ trenutnaVrijednost }: HeroStatsToggleProps) {
  const router = useRouter();
  const [prikazi, setPrikazi] = useState(trenutnaVrijednost);
  const [ucitavaSe, setUcitavaSe] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.admin.postavke.heroStatistike;

  async function promijeni(event: ChangeEvent<HTMLInputElement>) {
    const nova = event.target.checked;
    setGreska(null);
    setPrikazi(nova);
    setUcitavaSe(true);

    try {
      const rezultat = await setShowHeroStats(nova);

      if (!rezultat.ok) {
        setPrikazi(!nova);
        setGreska(rezultat.error);
        return;
      }

      router.refresh();
    } catch {
      setPrikazi(!nova);
      setGreska(poruke.greskaOpsta);
    } finally {
      setUcitavaSe(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2.5 text-sm font-medium text-[#1C2B22]">
        <input
          type="checkbox"
          checked={prikazi}
          onChange={promijeni}
          disabled={ucitavaSe}
          className="h-4 w-4 rounded border-[#1C2B22]/30"
        />
        {poruke.labela}
      </label>
      {greska ? (
        <p role="alert" className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
