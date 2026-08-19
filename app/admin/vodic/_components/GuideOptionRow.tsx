'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeGuideOptionAction, updateGuideOptionAction } from '@/lib/domain/admin-guide-actions';
import type { AdminCiljOpcija } from '@/lib/domain/admin-guide';
import { bs } from '@/lib/i18n/bs';

type GuideOptionRowProps = {
  opcija: AdminCiljOpcija;
};

const KLASE_INPUT =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-3 py-2 text-sm text-[#1C2B22] outline-none transition focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

const KLASE_TEXTAREA = `${KLASE_INPUT} resize-y`;

/**
 * Jedan red postojeće opcije — tekst opcije i objašnjenje se snimaju odmah
 * pri gubitku fokusa (isti autosave obrazac kao `ProductGoalRow`), nema
 * zajedničkog "Sačuvaj sve" dugmeta. "Ukloni" je soft-delete na serveru
 * (vidi `removeGuideOptionAction`) — red ovdje samo nestaje iz prikaza.
 */
export function GuideOptionRow({ opcija }: GuideOptionRowProps) {
  const router = useRouter();
  const poruke = bs.admin.vodic.detalj.opcije;

  const [tekstOpcije, setTekstOpcije] = useState(opcija.tekstOpcije);
  const [tekstObjasnjenja, setTekstObjasnjenja] = useState(opcija.tekstObjasnjenja ?? '');
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [sacuvano, setSacuvano] = useState(false);
  const [uklonjeno, setUklonjeno] = useState(false);

  const izmijenjeno =
    tekstOpcije !== opcija.tekstOpcije || tekstObjasnjenja !== (opcija.tekstObjasnjenja ?? '');

  async function sacuvaj() {
    if (!izmijenjeno) {
      return;
    }

    setGreska(null);
    setSacuvano(false);

    if (tekstOpcije.trim() === '') {
      setGreska(poruke.greskaTekstOpcije);
      return;
    }

    setUcitavanje(true);
    try {
      const rezultat = await updateGuideOptionAction(opcija.id, tekstOpcije, tekstObjasnjenja);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

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
    setUcitavanje(true);

    try {
      const rezultat = await removeGuideOptionAction(opcija.id);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        setUcitavanje(false);
        return;
      }

      setUklonjeno(true);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
      setUcitavanje(false);
    }
  }

  if (uklonjeno) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#1C2B22]/10 bg-white p-3">
      <input
        type="text"
        value={tekstOpcije}
        aria-label={poruke.polja.tekstOpcije}
        onChange={(event) => {
          setTekstOpcije(event.target.value);
          setSacuvano(false);
        }}
        onBlur={sacuvaj}
        disabled={ucitavanje}
        className={`${KLASE_INPUT} font-medium`}
      />
      <textarea
        rows={2}
        value={tekstObjasnjenja}
        aria-label={poruke.polja.tekstObjasnjenja}
        placeholder={poruke.polja.tekstObjasnjenjaPlaceholder}
        onChange={(event) => {
          setTekstObjasnjenja(event.target.value);
          setSacuvano(false);
        }}
        onBlur={sacuvaj}
        disabled={ucitavanje}
        className={KLASE_TEXTAREA}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={ukloni}
          disabled={ucitavanje}
          className="inline-flex items-center justify-center rounded-full border border-[#B3261E]/40 px-4 py-1.5 text-xs font-medium text-[#B3261E] transition-colors hover:bg-[#B3261E]/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ucitavanje ? poruke.ukloniUcitavanje : poruke.ukloni}
        </button>

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
    </div>
  );
}
