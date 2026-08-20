'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addFeaturingPlanAction } from '@/lib/domain/admin-featuring-actions';
import type { FeaturingPricePlan } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';
import { FeaturingPlanRow } from './FeaturingPlanRow';

type FeaturingPlansSectionProps = {
  tip: FeaturingPricePlan['tip'];
  naslov: string;
  planovi: FeaturingPricePlan[];
};

const KLASE_INPUT =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-3 py-2 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Jedna sekcija cjenovnika (paketi za proizvode ILI paketi za partnere) —
 * tabela postojećih paketa (`FeaturingPlanRow`, svaki sa vlastitim
 * autosave-om) plus zaseban obrazac za dodavanje novog paketa, isti obrazac
 * kao `GuideOptionsSection` (nova opcija/paket još nema `id`).
 */
export function FeaturingPlansSection({ tip, naslov, planovi }: FeaturingPlansSectionProps) {
  const router = useRouter();
  const poruke = bs.admin.cjenovnik;

  const [prikaziDodavanje, setPrikaziDodavanje] = useState(false);
  const [naziv, setNaziv] = useState('');
  const [trajanjeDana, setTrajanjeDana] = useState('');
  const [cijenaKm, setCijenaKm] = useState('');
  const [ponavljajuce, setPonavljajuce] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  function otkazi() {
    setPrikaziDodavanje(false);
    setNaziv('');
    setTrajanjeDana('');
    setCijenaKm('');
    setPonavljajuce(false);
    setGreska(null);
  }

  async function dodaj() {
    setGreska(null);
    setUcitavanje(true);

    try {
      const rezultat = await addFeaturingPlanAction(
        tip,
        naziv,
        Number.parseInt(trajanjeDana, 10),
        cijenaKm,
        ponavljajuce,
      );

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      otkazi();
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
      <h2 className="text-lg font-semibold text-[#1C2B22]">{naslov}</h2>

      {planovi.length === 0 ? (
        <p className="text-sm text-[#1C2B22]/60">{poruke.prazno}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1C2B22]/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C2B22]/10 text-xs font-medium uppercase tracking-wide text-[#8A9086]">
                <th className="px-4 py-3">{poruke.tabela.naziv}</th>
                <th className="px-4 py-3">{poruke.tabela.trajanje}</th>
                <th className="px-4 py-3">{poruke.tabela.cijena}</th>
                <th className="px-4 py-3">{poruke.tabela.ponavljajuce}</th>
                <th className="px-4 py-3">{poruke.tabela.aktivan}</th>
                <th className="px-4 py-3">{poruke.tabela.akcije}</th>
              </tr>
            </thead>
            <tbody>
              {planovi.map((plan) => (
                <FeaturingPlanRow key={plan.id} plan={plan} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {prikaziDodavanje ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[#1C2B22]/10 bg-[#F2F5ED] p-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#1C2B22]">
            {poruke.forma.naziv}
            <input
              type="text"
              value={naziv}
              onChange={(event) => setNaziv(event.target.value)}
              placeholder={poruke.forma.nazivPlaceholder}
              disabled={ucitavanje}
              className={KLASE_INPUT}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-[#1C2B22]">
              {poruke.forma.trajanjeDana}
              <input
                type="number"
                min={1}
                value={trajanjeDana}
                onChange={(event) => setTrajanjeDana(event.target.value)}
                disabled={ucitavanje}
                className={KLASE_INPUT}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-[#1C2B22]">
              {poruke.forma.cijenaKm}
              <input
                type="text"
                inputMode="decimal"
                value={cijenaKm}
                onChange={(event) => setCijenaKm(event.target.value)}
                disabled={ucitavanje}
                className={KLASE_INPUT}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#1C2B22]">
            <input
              type="checkbox"
              checked={ponavljajuce}
              onChange={(event) => setPonavljajuce(event.target.checked)}
              disabled={ucitavanje}
              className="h-4 w-4 rounded border-[#1C2B22]/30"
            />
            {poruke.forma.ponavljajuce}
          </label>

          {greska ? (
            <p role="alert" className="text-xs text-[#B3261E]">
              {greska}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={dodaj}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-5 py-2 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ucitavanje ? poruke.potvrdiUcitavanje : poruke.potvrdi}
            </button>
            <button
              type="button"
              onClick={otkazi}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-5 py-2 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {poruke.otkazi}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPrikaziDodavanje(true)}
          className="inline-flex w-fit items-center justify-center rounded-full border border-[#16332A]/40 px-5 py-2 text-sm font-medium text-[#16332A] transition-colors hover:bg-[#16332A]/10"
        >
          {poruke.dodajPaket}
        </button>
      )}
    </div>
  );
}
