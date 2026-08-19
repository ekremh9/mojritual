'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addGuideOptionAction } from '@/lib/domain/admin-guide-actions';
import type { AdminCiljOpcija } from '@/lib/domain/admin-guide';
import { bs } from '@/lib/i18n/bs';
import { GuideOptionRow } from './GuideOptionRow';

type GuideOptionsSectionProps = {
  goalId: string;
  opcije: AdminCiljOpcija[];
};

const MAX_OPCIJA_PO_CILJU = 5;

const KLASE_INPUT =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-3 py-2 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Opcije za dodatno pitanje (korak 3 Vodiča) na detalju cilja. Postojeće
 * opcije renderuje `GuideOptionRow` (svaka sa vlastitim autosave-om).
 * "Dodaj opciju" je zaseban obrazac ovdje jer nova opcija još nema `id` —
 * server dodjeljuje redoslijed. Maksimum od 5 se provjerava i ovdje (za UX —
 * dugme se sakriva), ALI stvarna granica je na serveru u
 * `addGuideOptionAction`, ovo je samo prečica da se ne šalje zahtjev koji će
 * server ionako odbiti.
 */
export function GuideOptionsSection({ goalId, opcije }: GuideOptionsSectionProps) {
  const router = useRouter();
  const poruke = bs.admin.vodic.detalj.opcije;

  const [prikaziDodavanje, setPrikaziDodavanje] = useState(false);
  const [noviTekstOpcije, setNoviTekstOpcije] = useState('');
  const [noviTekstObjasnjenja, setNoviTekstObjasnjenja] = useState('');
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const dostignutMaksimum = opcije.length >= MAX_OPCIJA_PO_CILJU;

  function otkazi() {
    setPrikaziDodavanje(false);
    setNoviTekstOpcije('');
    setNoviTekstObjasnjenja('');
    setGreska(null);
  }

  async function dodaj() {
    setGreska(null);

    if (noviTekstOpcije.trim() === '') {
      setGreska(poruke.greskaTekstOpcije);
      return;
    }

    setUcitavanje(true);
    try {
      const rezultat = await addGuideOptionAction(
        goalId,
        noviTekstOpcije,
        noviTekstObjasnjenja.trim() === '' ? undefined : noviTekstObjasnjenja,
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
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>
        <p className="text-sm text-[#1C2B22]/70">{poruke.podnaslov}</p>
      </div>

      {opcije.length === 0 ? (
        <p className="text-sm text-[#1C2B22]/60">{poruke.prazno}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {opcije.map((opcija) => (
            <GuideOptionRow key={opcija.id} opcija={opcija} />
          ))}
        </div>
      )}

      {prikaziDodavanje ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[#1C2B22]/10 bg-[#F2F5ED] p-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-[#1C2B22]">
            {poruke.polja.tekstOpcije}
            <input
              type="text"
              value={noviTekstOpcije}
              onChange={(event) => setNoviTekstOpcije(event.target.value)}
              placeholder={poruke.polja.tekstOpcijePlaceholder}
              disabled={ucitavanje}
              className={KLASE_INPUT}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-[#1C2B22]">
            {poruke.polja.tekstObjasnjenja}
            <textarea
              rows={2}
              value={noviTekstObjasnjenja}
              onChange={(event) => setNoviTekstObjasnjenja(event.target.value)}
              placeholder={poruke.polja.tekstObjasnjenjaPlaceholder}
              disabled={ucitavanje}
              className={`${KLASE_INPUT} resize-y`}
            />
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
      ) : dostignutMaksimum ? (
        <p className="text-xs text-[#8A9086]">{poruke.maksimumDostignut}</p>
      ) : (
        <button
          type="button"
          onClick={() => setPrikaziDodavanje(true)}
          className="inline-flex w-fit items-center justify-center rounded-full border border-[#16332A]/40 px-5 py-2 text-sm font-medium text-[#16332A] transition-colors hover:bg-[#16332A]/10"
        >
          {poruke.dodajOpciju}
        </button>
      )}
    </div>
  );
}
