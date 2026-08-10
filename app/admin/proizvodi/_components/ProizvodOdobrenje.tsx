'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveProductAction, rejectProductAction } from '@/lib/domain/admin-actions';
import { bs } from '@/lib/i18n/bs';

type ProizvodOdobrenjeProps = {
  productId: string;
};

const KLASE_POLJA =
  'w-full resize-y rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Akcije odobravanja za proizvod na čekanju. Odbijanje otvara formular sa
 * obaveznim razlogom — brend ga vidi i njime ispravlja proizvod (spec 10.4).
 */
export function ProizvodOdobrenje({ productId }: ProizvodOdobrenjeProps) {
  const router = useRouter();
  const poruke = bs.admin.proizvodi.detalj;

  const [prikaziOdbijanje, setPrikaziOdbijanje] = useState(false);
  const [razlog, setRazlog] = useState('');
  const [greskaRazloga, setGreskaRazloga] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState<'odobren' | 'odbijen' | null>(null);
  const [ucitavanje, setUcitavanje] = useState<'odobri' | 'odbij' | null>(null);

  async function odobri() {
    setGreska(null);
    setUcitavanje('odobri');

    try {
      const rezultat = await approveProductAction(productId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh('odobren');
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(null);
    }
  }

  async function odbij() {
    setGreska(null);
    setGreskaRazloga(null);

    if (razlog.trim().length < 10) {
      setGreskaRazloga(poruke.odbijanje.greskaRazlog);
      return;
    }

    setUcitavanje('odbij');

    try {
      const rezultat = await rejectProductAction(productId, razlog);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh('odbijen');
      setPrikaziOdbijanje(false);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(null);
    }
  }

  if (uspjeh) {
    return (
      <p
        role="status"
        className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]"
      >
        {uspjeh === 'odobren' ? poruke.uspjehOdobreno : poruke.uspjehOdbijeno}
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

      {prikaziOdbijanje ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
          <label htmlFor="razlog-odbijanja" className="text-sm font-medium text-[#1C2B22]">
            {poruke.odbijanje.naslov}
          </label>
          <textarea
            id="razlog-odbijanja"
            rows={4}
            value={razlog}
            onChange={(event) => {
              setRazlog(event.target.value);
              setGreskaRazloga(null);
            }}
            placeholder={poruke.odbijanje.placeholder}
            aria-invalid={greskaRazloga ? true : undefined}
            className={KLASE_POLJA}
          />
          {greskaRazloga ? <p className="text-xs text-[#B3261E]">{greskaRazloga}</p> : null}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={odbij}
              disabled={ucitavanje !== null}
              className="inline-flex items-center justify-center rounded-full bg-[#B3261E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B3261E]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ucitavanje === 'odbij' ? poruke.odbijanje.dugmeUcitavanje : poruke.odbijanje.dugme}
            </button>
            <button
              type="button"
              onClick={() => {
                setPrikaziOdbijanje(false);
                setRazlog('');
                setGreskaRazloga(null);
              }}
              disabled={ucitavanje !== null}
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-6 py-2.5 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {poruke.odbijanje.otkazi}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={odobri}
            disabled={ucitavanje !== null}
            className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ucitavanje === 'odobri' ? poruke.odobriUcitavanje : poruke.odobri}
          </button>
          <button
            type="button"
            onClick={() => setPrikaziOdbijanje(true)}
            disabled={ucitavanje !== null}
            className="inline-flex items-center justify-center rounded-full border border-[#B3261E]/40 px-6 py-2.5 text-sm font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {poruke.odbij}
          </button>
        </div>
      )}
    </div>
  );
}
