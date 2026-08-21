'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { updateImeAction } from '@/lib/domain/nalog-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-ritual-charcoal/15 bg-white px-4 py-2.5 text-sm text-ritual-charcoal outline-none transition placeholder:text-ritual-charcoal/40 focus:border-ritual-deep-green focus:ring-2 focus:ring-ritual-deep-green/20 disabled:cursor-not-allowed disabled:bg-ritual-beige disabled:text-ritual-charcoal/60';

type ImeFormaProps = {
  pocetnoIme: string;
};

export function ImeForma({ pocetnoIme }: ImeFormaProps) {
  const router = useRouter();
  const poruke = bs.nalog.forma;

  const [ime, setIme] = useState(pocetnoIme);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [saljeSe, setSaljeSe] = useState(false);

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);
    setUspjeh(false);
    setSaljeSe(true);

    try {
      const rezultat = await updateImeAction(ime);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        return;
      }

      setUspjeh(true);
      router.refresh();
    } catch {
      setGreska(poruke.greskaOpsta);
    } finally {
      setSaljeSe(false);
    }
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nalog-ime" className="text-sm font-medium text-ritual-charcoal">
          {poruke.ime}
        </label>
        <input
          id="nalog-ime"
          name="ime"
          type="text"
          placeholder={poruke.imePlaceholder}
          value={ime}
          onChange={(event) => {
            setIme(event.target.value);
            setUspjeh(false);
          }}
          disabled={saljeSe}
          aria-invalid={greska ? true : undefined}
          className={KLASE_POLJA}
        />
      </div>

      {uspjeh ? (
        <p
          role="status"
          className="rounded-xl bg-ritual-green/50 px-4 py-3 text-sm font-medium text-ritual-deep-green"
        >
          {poruke.uspjeh}
        </p>
      ) : null}

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saljeSe}
        className="inline-flex w-fit items-center justify-center rounded-full bg-ritual-deep-green px-6 py-2.5 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saljeSe ? poruke.sacuvajUcitavanje : poruke.sacuvaj}
      </button>
    </form>
  );
}
