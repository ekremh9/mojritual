'use client';

import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { setFooterOpis, setHeroNaslov, setHeroOpis } from '@/lib/domain/site-settings';
import { bs } from '@/lib/i18n/bs';

type SiteTekstoviFormaProps = {
  trenutniHeroNaslov: string;
  trenutniHeroOpis: string;
  trenutniFooterOpis: string;
};

const KLASA_TEXTAREA =
  'w-full rounded-xl border border-[#1C2B22]/15 px-3 py-2 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A]';

/**
 * Tri textarea polja, JEDNO zajedničko "Sačuvaj" dugme — polja se obično
 * uređuju zajedno (jedna sesija izmjene teksta na sajtu), a odvojena
 * dugmad/stanja učitavanja za svako polje bi samo dodala buku bez stvarne
 * koristi (snimanje nepromijenjenog polja je bezopasno, ista vrijednost
 * se samo ponovo upiše).
 */
export function SiteTekstoviForma({
  trenutniHeroNaslov,
  trenutniHeroOpis,
  trenutniFooterOpis,
}: SiteTekstoviFormaProps) {
  const router = useRouter();
  const [heroNaslov, setHeroNaslovPolje] = useState(trenutniHeroNaslov);
  const [heroOpis, setHeroOpisPolje] = useState(trenutniHeroOpis);
  const [footerOpis, setFooterOpisPolje] = useState(trenutniFooterOpis);
  const [ucitavaSe, setUcitavaSe] = useState(false);
  const [uspjeh, setUspjeh] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const poruke = bs.admin.postavke.tekstoviSajta;

  async function sacuvaj() {
    setGreska(null);
    setUspjeh(false);
    setUcitavaSe(true);

    try {
      const rezultati = await Promise.all([
        setHeroNaslov(heroNaslov),
        setHeroOpis(heroOpis),
        setFooterOpis(footerOpis),
      ]);

      const neuspjeh = rezultati.find((rezultat) => !rezultat.ok);
      if (neuspjeh && !neuspjeh.ok) {
        setGreska(neuspjeh.error);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setUcitavaSe(false);
    }
  }

  function napraviHandler(setter: (vrijednost: string) => void) {
    return (event: ChangeEvent<HTMLTextAreaElement>) => {
      setUspjeh(false);
      setter(event.target.value);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C2B22]">{poruke.heroNaslov}</span>
        <textarea
          value={heroNaslov}
          onChange={napraviHandler(setHeroNaslovPolje)}
          rows={2}
          disabled={ucitavaSe}
          className={KLASA_TEXTAREA}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C2B22]">{poruke.heroOpis}</span>
        <textarea
          value={heroOpis}
          onChange={napraviHandler(setHeroOpisPolje)}
          rows={3}
          disabled={ucitavaSe}
          className={KLASA_TEXTAREA}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[#1C2B22]">{poruke.footerOpis}</span>
        <textarea
          value={footerOpis}
          onChange={napraviHandler(setFooterOpisPolje)}
          rows={3}
          disabled={ucitavaSe}
          className={KLASA_TEXTAREA}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sacuvaj}
          disabled={ucitavaSe}
          className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-5 py-2 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ucitavaSe ? poruke.cuvanje : poruke.sacuvaj}
        </button>
        {uspjeh ? <span className="text-xs text-[#16332A]">{poruke.uspjeh}</span> : null}
      </div>

      {greska ? (
        <p role="alert" className="text-xs text-[#B3261E]">
          {greska}
        </p>
      ) : null}
    </div>
  );
}
