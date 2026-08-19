'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleVerifiedAction } from '@/lib/domain/admin-actions';
import { bs } from '@/lib/i18n/bs';

type VerifikacijaPartneraProps = {
  brandId: string;
  verifikovan: boolean;
  odobren: boolean;
};

/**
 * Ručno upravljanje `brands.verifikovan` — nezavisno od statusa odobrenja
 * brenda (`brands.status`), isti pattern kao `IsticanjePartnera`. Radi na
 * svakom statusu; javna stranica partnera prikazuje značku tek kad je
 * brend odobren.
 */
export function VerifikacijaPartnera({
  brandId,
  verifikovan: verifikovanPocetno,
  odobren,
}: VerifikacijaPartneraProps) {
  const router = useRouter();
  const poruke = bs.admin.brendovi.detalj.verifikacija;

  const [verifikovan, setVerifikovan] = useState(verifikovanPocetno);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState(false);

  async function promijeni() {
    setGreska(null);
    setUspjeh(null);
    setUcitavanje(true);

    const novoStanje = !verifikovan;

    try {
      const rezultat = await toggleVerifiedAction(brandId, novoStanje);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setVerifikovan(novoStanje);
      setUspjeh(novoStanje ? poruke.uspjehVerifikovano : poruke.uspjehUklonjeno);
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
          {verifikovan ? poruke.verifikovan : poruke.nijeVerifikovan}
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
          verifikovan
            ? 'border border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E]/10'
            : 'bg-[#16332A] text-[#F2F5ED] hover:bg-[#16332A]/90'
        }`}
      >
        {ucitavanje ? poruke.ucitavanje : verifikovan ? poruke.ukloni : poruke.verifikuj}
      </button>
    </section>
  );
}
