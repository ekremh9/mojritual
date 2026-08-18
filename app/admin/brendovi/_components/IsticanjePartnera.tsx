'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleBrandFeaturedAction } from '@/lib/domain/admin-actions';
import { bs } from '@/lib/i18n/bs';

type IsticanjePartneraProps = {
  brandId: string;
  istaknut: boolean;
  odobren: boolean;
};

/**
 * Ručno upravljanje `brands.istaknut` — isti pattern kao
 * `IsticanjeProizvoda`, ali bez "zahtjev" varijante (vidi komentar uz
 * `toggleBrandFeaturedAction`). Radi na svakom statusu; homepage/lista
 * partnera ionako filtriraju na `status = 'odobren'`.
 */
export function IsticanjePartnera({ brandId, istaknut: istaknutPocetno, odobren }: IsticanjePartneraProps) {
  const router = useRouter();
  const poruke = bs.admin.brendovi.detalj.isticanje;

  const [istaknut, setIstaknut] = useState(istaknutPocetno);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState(false);

  async function promijeni() {
    setGreska(null);
    setUspjeh(null);
    setUcitavanje(true);

    const novoStanje = !istaknut;

    try {
      const rezultat = await toggleBrandFeaturedAction(brandId, novoStanje);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setIstaknut(novoStanje);
      setUspjeh(novoStanje ? poruke.uspjehAktivirano : poruke.uspjehUklonjeno);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
      <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>

      <div className="flex justify-between gap-4 text-sm">
        <span className="text-[#1C2B22]/60">{poruke.trenutno}</span>
        <span className="font-medium text-[#1C2B22]">
          {istaknut ? poruke.trenutnoDa : poruke.trenutnoNe}
        </span>
      </div>

      {!odobren ? (
        <p className="rounded-xl bg-[#C7D6BA]/40 px-3 py-2 text-xs text-[#1C2B22]/70">
          {poruke.napomenaNijeOdobren}
        </p>
      ) : null}

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      {uspjeh ? (
        <p role="status" className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]">
          {uspjeh}
        </p>
      ) : null}

      <button
        type="button"
        onClick={promijeni}
        disabled={ucitavanje}
        className={`inline-flex w-fit items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          istaknut
            ? 'border border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E]/10'
            : 'bg-[#16332A] text-[#F2F5ED] hover:bg-[#16332A]/90'
        }`}
      >
        {ucitavanje ? poruke.ucitavanje : istaknut ? poruke.ukloni : poruke.aktiviraj}
      </button>
    </section>
  );
}
