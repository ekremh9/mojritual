'use client';

import { useState, type FormEvent } from 'react';
import { requestPasswordResetAction } from '@/lib/domain/auth-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-ritual-charcoal/15 bg-white px-4 py-2.5 text-sm text-ritual-charcoal outline-none transition placeholder:text-ritual-charcoal/40 focus:border-ritual-deep-green focus:ring-2 focus:ring-ritual-deep-green/20';

const KLASE_LABELE = 'text-sm font-medium text-ritual-charcoal';

/**
 * Poruka uspjeha je IDENTIČNA bez obzira da li nalog s unesenim emailom
 * postoji (vidi `requestPasswordResetAction`) — forma ne smije nikad
 * pokazati drugačije stanje za "email postoji" naspram "email ne postoji".
 */
export function ZaboravljenaLozinkaForma() {
  const [email, setEmail] = useState('');
  const [greska, setGreska] = useState<string | null>(null);
  const [uspjeh, setUspjeh] = useState(false);
  const [saljeSe, setSaljeSe] = useState(false);

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);
    setSaljeSe(true);

    const podaci = new FormData();
    podaci.set('email', email.trim().toLowerCase());

    try {
      const rezultat = await requestPasswordResetAction(podaci);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        setSaljeSe(false);
        return;
      }

      setUspjeh(true);
      setSaljeSe(false);
    } catch {
      setGreska(bs.zaboravljenaLozinka.greskaOpsta);
      setSaljeSe(false);
    }
  }

  if (uspjeh) {
    return (
      <p
        role="status"
        className="rounded-xl bg-ritual-green/50 px-4 py-3 text-sm font-medium text-ritual-deep-green"
      >
        {bs.zaboravljenaLozinka.uspjeh}
      </p>
    );
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={KLASE_LABELE}>
          {bs.zaboravljenaLozinka.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={bs.zaboravljenaLozinka.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={saljeSe}
          className={KLASE_POLJA}
        />
      </div>

      {greska ? (
        <p role="alert" className="rounded-xl bg-[#B3261E]/10 px-4 py-3 text-sm text-[#B3261E]">
          {greska}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saljeSe}
        className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-ritual-deep-green px-6 py-3 text-sm font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saljeSe ? bs.zaboravljenaLozinka.dugmeUcitavanje : bs.zaboravljenaLozinka.dugme}
      </button>
    </form>
  );
}
