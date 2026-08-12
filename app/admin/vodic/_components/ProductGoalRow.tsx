'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { removeProductGoalAction, setProductGoalAction } from '@/lib/domain/admin-guide-actions';
import { bs } from '@/lib/i18n/bs';

type Oznaka = 'primarni' | 'sekundarni';

type ProductGoalRowProps = {
  productId: string;
  goalId: string;
  naziv: string;
  brendNaziv: string;
  slika: { url: string; alt: string | null } | null;
  pocetnoVezan: boolean;
  pocetnaRelevantnost: number | null;
  pocetnaOznaka: Oznaka | null;
};

const KLASE_INPUT =
  'w-20 rounded-lg border border-[#1C2B22]/15 bg-white px-2 py-1.5 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED]';

const KLASE_SELECT =
  'rounded-lg border border-[#1C2B22]/15 bg-white px-2 py-1.5 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED]';

/**
 * Jedan red tabele proizvoda na detalju cilja. Svaka izmjena (dodavanje,
 * ažuriranje relevantnosti/oznake, uklanjanje) šalje se odmah kroz zaseban
 * server action — nema zajedničkog "Sačuvaj sve" dugmeta.
 */
export function ProductGoalRow({
  productId,
  goalId,
  naziv,
  brendNaziv,
  slika,
  pocetnoVezan,
  pocetnaRelevantnost,
  pocetnaOznaka,
}: ProductGoalRowProps) {
  const router = useRouter();
  const poruke = bs.admin.vodic.detalj.proizvodi;

  const [vezan, setVezan] = useState(pocetnoVezan);
  const [relevantnost, setRelevantnost] = useState(String(pocetnaRelevantnost ?? 50));
  const [oznaka, setOznaka] = useState<Oznaka>(pocetnaOznaka ?? 'sekundarni');
  const [prikaziDodavanje, setPrikaziDodavanje] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [sacuvano, setSacuvano] = useState(false);

  useEffect(() => {
    if (!sacuvano) {
      return;
    }
    const tajmer = setTimeout(() => setSacuvano(false), 2000);
    return () => clearTimeout(tajmer);
  }, [sacuvano]);

  function parsirajRelevantnost(): number | null {
    const broj = Number(relevantnost);
    if (!Number.isInteger(broj) || broj < 1 || broj > 100) {
      return null;
    }
    return broj;
  }

  async function sacuvajVezu(sljedecaOznaka?: Oznaka) {
    setGreska(null);
    setSacuvano(false);

    const broj = parsirajRelevantnost();
    if (broj === null) {
      setGreska(poruke.greskaRelevantnost);
      return;
    }

    setUcitavanje(true);
    try {
      const rezultat = await setProductGoalAction(productId, goalId, broj, sljedecaOznaka ?? oznaka);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setVezan(true);
      setPrikaziDodavanje(false);
      setSacuvano(true);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  async function ukloni() {
    setGreska(null);
    setSacuvano(false);
    setUcitavanje(true);

    try {
      const rezultat = await removeProductGoalAction(productId, goalId);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setVezan(false);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  const prikaziPolja = vezan || prikaziDodavanje;

  return (
    <tr className="border-b border-[#1C2B22]/10 last:border-0">
      <td className="px-4 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#1C2B22]/10 bg-[#F2F5ED]">
          {slika ? (
            <Image
              src={slika.url}
              alt={slika.alt ?? naziv}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-[#1C2B22]">{naziv}</td>
      <td className="px-4 py-3 text-[#1C2B22]/70">{brendNaziv}</td>

      {prikaziPolja ? (
        <>
          <td className="px-4 py-3">
            <input
              type="number"
              min={1}
              max={100}
              value={relevantnost}
              aria-label={poruke.relevantnostLabela}
              onChange={(event) => {
                setRelevantnost(event.target.value);
                setSacuvano(false);
              }}
              onBlur={() => {
                if (vezan) {
                  sacuvajVezu();
                }
              }}
              disabled={ucitavanje}
              className={KLASE_INPUT}
            />
          </td>
          <td className="px-4 py-3">
            <select
              value={oznaka}
              aria-label={poruke.oznakaLabela}
              onChange={(event) => {
                const nova = event.target.value as Oznaka;
                setOznaka(nova);
                if (vezan) {
                  sacuvajVezu(nova);
                }
              }}
              disabled={ucitavanje}
              className={KLASE_SELECT}
            >
              <option value="primarni">{poruke.oznake.primarni}</option>
              <option value="sekundarni">{poruke.oznake.sekundarni}</option>
            </select>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 text-[#1C2B22]/40">—</td>
          <td className="px-4 py-3 text-[#1C2B22]/40">—</td>
        </>
      )}

      <td className="px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          {vezan ? (
            <button
              type="button"
              onClick={ukloni}
              disabled={ucitavanje}
              className="inline-flex items-center justify-center rounded-full border border-[#B3261E]/40 px-4 py-1.5 text-xs font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ucitavanje ? poruke.ukloniUcitavanje : poruke.ukloniIzCilja}
            </button>
          ) : prikaziDodavanje ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sacuvajVezu()}
                disabled={ucitavanje}
                className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-4 py-1.5 text-xs font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ucitavanje ? poruke.potvrdiUcitavanje : poruke.potvrdiDodavanje}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrikaziDodavanje(false);
                  setGreska(null);
                }}
                disabled={ucitavanje}
                className="inline-flex items-center justify-center rounded-full border border-[#1C2B22]/20 px-4 py-1.5 text-xs font-medium text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {poruke.otkazi}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPrikaziDodavanje(true)}
              className="inline-flex items-center justify-center rounded-full border border-[#16332A]/40 px-4 py-1.5 text-xs font-medium text-[#16332A] transition-colors hover:bg-[#16332A]/10"
            >
              {poruke.dodajUCilj}
            </button>
          )}

          {greska ? (
            <p role="alert" className="text-xs text-[#B3261E]">
              {greska}
            </p>
          ) : null}
          {sacuvano && !greska ? (
            <p role="status" className="text-xs font-medium text-[#16332A]">
              {poruke.sacuvano}
            </p>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
