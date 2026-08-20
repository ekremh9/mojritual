'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  togglePlanActiveAction,
  updateFeaturingPlanAction,
} from '@/lib/domain/admin-featuring-actions';
import type { FeaturingPricePlan } from '@/lib/db/schema';
import { feningToKm, formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

type FeaturingPlanRowProps = {
  plan: FeaturingPricePlan;
};

const KLASE_INPUT =
  'w-full rounded-lg border border-[#1C2B22]/15 bg-white px-2 py-1 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Jedan red paketa — po defaultu prikaz, "Uredi" prebacuje red u formu za
 * izmjenu (naziv/trajanje/cijena/ponavljajuće), "Sačuvaj" snima sve odjednom
 * (za razliku od `GuideOptionRow` koji autosave-uje onBlur po polju — ovdje
 * su polja previše međuzavisna, npr. broj + tekst, da bi pojedinačni
 * autosave imao smisla). "Deaktiviraj"/"Aktiviraj" je odvojen brzi toggle,
 * dostupan i van edit moda.
 */
export function FeaturingPlanRow({ plan }: FeaturingPlanRowProps) {
  const router = useRouter();
  const poruke = bs.admin.cjenovnik;

  const [urediMod, setUrediMod] = useState(false);
  const [naziv, setNaziv] = useState(plan.naziv);
  const [trajanjeDana, setTrajanjeDana] = useState(String(plan.trajanjeDana));
  const [cijenaKm, setCijenaKm] = useState(String(feningToKm(plan.cijena)));
  const [ponavljajuce, setPonavljajuce] = useState(plan.ponavljajuce);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  function otkaziUredjivanje() {
    setUrediMod(false);
    setNaziv(plan.naziv);
    setTrajanjeDana(String(plan.trajanjeDana));
    setCijenaKm(String(feningToKm(plan.cijena)));
    setPonavljajuce(plan.ponavljajuce);
    setGreska(null);
  }

  async function sacuvaj() {
    setGreska(null);
    setUcitavanje(true);

    try {
      const rezultat = await updateFeaturingPlanAction(plan.id, {
        naziv,
        trajanjeDana: Number.parseInt(trajanjeDana, 10),
        cijenaKm,
        ponavljajuce,
      });

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUrediMod(false);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  async function promijeniAktivnost() {
    setGreska(null);
    setUcitavanje(true);

    try {
      const rezultat = await togglePlanActiveAction(plan.id, !plan.aktivan);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  if (urediMod) {
    return (
      <tr className="border-b border-[#1C2B22]/10 bg-[#F2F5ED]/50 last:border-0 align-top">
        <td className="px-4 py-3">
          <input
            type="text"
            value={naziv}
            onChange={(event) => setNaziv(event.target.value)}
            disabled={ucitavanje}
            className={KLASE_INPUT}
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            min={1}
            value={trajanjeDana}
            onChange={(event) => setTrajanjeDana(event.target.value)}
            disabled={ucitavanje}
            className={KLASE_INPUT}
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            inputMode="decimal"
            value={cijenaKm}
            onChange={(event) => setCijenaKm(event.target.value)}
            disabled={ucitavanje}
            className={KLASE_INPUT}
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={ponavljajuce}
            onChange={(event) => setPonavljajuce(event.target.checked)}
            disabled={ucitavanje}
            className="h-4 w-4 rounded border-[#1C2B22]/30"
          />
        </td>
        <td className="px-4 py-3 text-[#1C2B22]/70">
          {plan.aktivan ? poruke.da : poruke.ne}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sacuvaj}
                disabled={ucitavanje}
                className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-4 py-1.5 text-xs font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ucitavanje ? poruke.ucitavanje : poruke.sacuvaj}
              </button>
              <button
                type="button"
                onClick={otkaziUredjivanje}
                disabled={ucitavanje}
                className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-4 py-1.5 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {poruke.otkazi}
              </button>
            </div>
            {greska ? (
              <p role="alert" className="text-xs text-[#B3261E]">
                {greska}
              </p>
            ) : null}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[#1C2B22]/10 last:border-0">
      <td className="px-4 py-3 font-medium text-[#1C2B22]">{plan.naziv}</td>
      <td className="px-4 py-3 text-[#1C2B22]/70">{poruke.dana(plan.trajanjeDana)}</td>
      <td className="px-4 py-3 text-[#1C2B22]/70">{formatCijena(plan.cijena)}</td>
      <td className="px-4 py-3 text-[#1C2B22]/70">{plan.ponavljajuce ? poruke.da : poruke.ne}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            plan.aktivan ? 'bg-[#16332A] text-[#F2F5ED]' : 'bg-[#8A9086]/15 text-[#1C2B22]/70'
          }`}
        >
          {plan.aktivan ? poruke.da : poruke.ne}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUrediMod(true)}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-4 py-1.5 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {poruke.uredi}
            </button>
            <button
              type="button"
              onClick={promijeniAktivnost}
              disabled={ucitavanje}
              className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                plan.aktivan
                  ? 'border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E]/10'
                  : 'border-[#16332A]/40 text-[#16332A] hover:bg-[#16332A]/10'
              }`}
            >
              {ucitavanje ? poruke.ucitavanje : plan.aktivan ? poruke.deaktiviraj : poruke.aktiviraj}
            </button>
          </div>
          {greska ? (
            <p role="alert" className="text-xs text-[#B3261E]">
              {greska}
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
