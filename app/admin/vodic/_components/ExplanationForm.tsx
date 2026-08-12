'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveExplanationTemplateAction } from '@/lib/domain/admin-guide-actions';
import { bs } from '@/lib/i18n/bs';

type ExplanationFormProps = {
  goalId: string;
  pocetniTekst: string;
};

const KLASE_POLJA =
  'w-full resize-y rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/** Uređivanje aktivnog teksta objašnjenja za cilj — update ako postoji, insert ako ne. */
export function ExplanationForm({ goalId, pocetniTekst }: ExplanationFormProps) {
  const router = useRouter();
  const poruke = bs.admin.vodic.detalj.tekst;

  const [tekst, setTekst] = useState(pocetniTekst);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);

  async function sacuvaj() {
    setGreska(null);
    setUspjeh(false);
    setUcitavanje(true);

    try {
      const rezultat = await saveExplanationTemplateAction(goalId, tekst);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(bs.admin.greskaOpsta);
    } finally {
      setUcitavanje(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-4">
      <h2 className="text-lg font-semibold text-[#1C2B22]">{poruke.naslov}</h2>

      <textarea
        rows={5}
        value={tekst}
        onChange={(event) => {
          setTekst(event.target.value);
          setUspjeh(false);
        }}
        placeholder={poruke.placeholder}
        className={KLASE_POLJA}
      />

      {greska ? (
        <p role="alert" className="text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      {uspjeh ? (
        <p role="status" className="text-sm font-medium text-[#16332A]">
          {poruke.uspjeh}
        </p>
      ) : null}

      <div>
        <button
          type="button"
          onClick={sacuvaj}
          disabled={ucitavanje}
          className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-6 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {ucitavanje ? poruke.sacuvajUcitavanje : poruke.sacuvaj}
        </button>
      </div>
    </div>
  );
}
