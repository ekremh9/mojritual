'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { revokeApprovalAction } from '@/lib/domain/admin-actions';
import { bs } from '@/lib/i18n/bs';

type VratiNaPopravkuProps = {
  productId: string;
};

const KLASE_POLJA =
  'w-full resize-y rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Vraća VEĆ ODOBREN proizvod na popravku uz obavezan razlog — isti UI
 * obrazac kao odbijanje proizvoda na čekanju (ProizvodOdobrenje.tsx), samo
 * za suprotan smjer: proizvod koji je bio javno vidljiv, admin ga povlači
 * (spec: status → 'nacrt', brend dobija obavještenje sa razlogom).
 */
export function VratiNaPopravku({ productId }: VratiNaPopravkuProps) {
  const router = useRouter();
  const poruke = bs.admin.proizvodi.detalj.vratiNaPopravku;

  const [prikaziForma, setPrikaziForma] = useState(false);
  const [razlog, setRazlog] = useState('');
  const [greskaRazloga, setGreskaRazloga] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(false);

  async function vrati() {
    setGreska(null);
    setGreskaRazloga(null);

    if (razlog.trim().length < 10) {
      setGreskaRazloga(poruke.greskaRazlog);
      return;
    }

    setUcitavanje(true);

    try {
      const rezultat = await revokeApprovalAction(productId, razlog);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh(true);
      setPrikaziForma(false);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  if (uspjeh) {
    return (
      <p
        role="status"
        className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]"
      >
        {poruke.uspjeh}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      {prikaziForma ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
          <label htmlFor="razlog-vracanja" className="text-sm font-medium text-[#1C2B22]">
            {poruke.naslov}
          </label>
          <textarea
            id="razlog-vracanja"
            rows={4}
            value={razlog}
            onChange={(event) => {
              setRazlog(event.target.value);
              setGreskaRazloga(null);
            }}
            placeholder={poruke.placeholder}
            aria-invalid={greskaRazloga ? true : undefined}
            className={KLASE_POLJA}
          />
          {greskaRazloga ? <p className="text-xs text-[#B3261E]">{greskaRazloga}</p> : null}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={vrati}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full bg-[#B3261E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B3261E]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ucitavanje ? poruke.dugmeUcitavanje : poruke.dugmePotvrdi}
            </button>
            <button
              type="button"
              onClick={() => {
                setPrikaziForma(false);
                setRazlog('');
                setGreskaRazloga(null);
              }}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-6 py-2.5 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {poruke.otkazi}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPrikaziForma(true)}
            className="inline-flex items-center justify-center rounded-full border border-[#B3261E]/40 px-6 py-2.5 text-sm font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10"
          >
            {poruke.dugme}
          </button>
        </div>
      )}
    </div>
  );
}
