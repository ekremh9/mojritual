'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveFeaturedAction, rejectFeaturedAction } from '@/lib/domain/admin-actions';
import type { Product } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

type IsticanjeProizvodaProps = {
  productId: string;
  istaknutStatus: Product['istaknutStatus'];
  istaknutRazlogOdbijanja: string | null;
  odobren: boolean;
};

const KLASE_POLJA =
  'w-full resize-y rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Odobrava/odbija isticanje na početnoj — `products.istaknutStatus`,
 * odvojeno od odobrenja proizvoda samog (radi na svakom statusu proizvoda;
 * homepage/katalog ionako filtriraju na `status = 'odobren'`, pa isticanje
 * neodobrenog proizvoda nema efekta dok ne bude odobren). Odbijanje otvara
 * formular sa obaveznim razlogom — isti obrazac kao `ProizvodOdobrenje`.
 */
export function IsticanjeProizvoda({
  productId,
  istaknutStatus: istaknutStatusPocetno,
  istaknutRazlogOdbijanja: istaknutRazlogPocetno,
  odobren,
}: IsticanjeProizvodaProps) {
  const router = useRouter();
  const poruke = bs.admin.proizvodi.detalj.isticanje;

  const [istaknutStatus, setIstaknutStatus] = useState(istaknutStatusPocetno);
  const [istaknutRazlog, setIstaknutRazlog] = useState(istaknutRazlogPocetno);
  const [prikaziOdbijanje, setPrikaziOdbijanje] = useState(false);
  const [razlog, setRazlog] = useState('');
  const [greskaRazloga, setGreskaRazloga] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState<string | null>(null);
  const [ucitavanje, setUcitavanje] = useState<'odobri' | 'odbij' | null>(null);

  async function odobri() {
    setGreska(null);
    setUspjeh(null);
    setUcitavanje('odobri');

    try {
      const rezultat = await approveFeaturedAction(productId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setIstaknutStatus('odobreno');
      setIstaknutRazlog(null);
      setUspjeh(poruke.uspjehOdobreno);
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
      setGreskaRazloga(poruke.greskaRazlog);
      return;
    }

    setUcitavanje('odbij');

    try {
      const rezultat = await rejectFeaturedAction(productId, razlog);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setIstaknutStatus('odbijeno');
      setIstaknutRazlog(razlog.trim());
      setUspjeh(poruke.uspjehOdbijeno);
      setPrikaziOdbijanje(false);
      setRazlog('');
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
      <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>

      <div className="flex justify-between gap-4 text-sm">
        <span className="text-[#1C2B22]/60">{poruke.trenutno}</span>
        <span className="font-medium text-[#1C2B22]">{poruke.statusi[istaknutStatus]}</span>
      </div>

      {istaknutStatus === 'odbijeno' && istaknutRazlog ? (
        <p className="rounded-xl bg-[#B3261E]/10 px-3 py-2 text-xs text-[#B3261E]">
          {poruke.razlogPrefiks} {istaknutRazlog}
        </p>
      ) : null}

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
        <p
          role="status"
          className="rounded-xl bg-[#C7D6BA]/50 px-4 py-3 text-sm font-medium text-[#16332A]"
        >
          {uspjeh}
        </p>
      ) : null}

      {prikaziOdbijanje ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`isticanje-razlog-${productId}`}
            className="text-sm font-medium text-[#1C2B22]"
          >
            {poruke.razlogNaslov}
          </label>
          <textarea
            id={`isticanje-razlog-${productId}`}
            rows={3}
            value={razlog}
            onChange={(event) => {
              setRazlog(event.target.value);
              setGreskaRazloga(null);
            }}
            placeholder={poruke.razlogPlaceholder}
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
              {ucitavanje === 'odbij' ? poruke.ucitavanje : poruke.odbij}
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
              {poruke.otkazi}
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
            {ucitavanje === 'odobri' ? poruke.ucitavanje : poruke.aktiviraj}
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
    </section>
  );
}
