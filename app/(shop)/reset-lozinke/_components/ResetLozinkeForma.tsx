'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { resetPasswordAction } from '@/lib/domain/auth-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-ritual-charcoal/15 bg-white px-4 py-2.5 text-sm text-ritual-charcoal outline-none transition placeholder:text-ritual-charcoal/40 focus:border-ritual-deep-green focus:ring-2 focus:ring-ritual-deep-green/20';

const KLASE_LABELE = 'text-sm font-medium text-ritual-charcoal';

type ResetLozinkeFormaProps = {
  token: string;
};

export function ResetLozinkeForma({ token }: ResetLozinkeFormaProps) {
  const router = useRouter();
  const [lozinka, setLozinka] = useState('');
  const [potvrda, setPotvrda] = useState('');
  const [greska, setGreska] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);
    setSaljeSe(true);

    const podaci = new FormData();
    podaci.set('token', token);
    podaci.set('lozinka', lozinka);
    podaci.set('potvrda', potvrda);

    try {
      const rezultat = await resetPasswordAction(podaci);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        setSaljeSe(false);
        return;
      }

      // Namjerno ostaje u loading stanju dok navigacija ne završi.
      router.push('/prijava?reset=uspjeh');
    } catch {
      setGreska(bs.resetLozinke.greskaOpsta);
      setSaljeSe(false);
    }
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lozinka" className={KLASE_LABELE}>
          {bs.resetLozinke.lozinka}
        </label>
        <input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="new-password"
          required
          value={lozinka}
          onChange={(event) => setLozinka(event.target.value)}
          disabled={saljeSe}
          className={KLASE_POLJA}
        />
        <p className="text-xs text-ritual-charcoal/60">{bs.resetLozinke.lozinkaPomoc}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="potvrda" className={KLASE_LABELE}>
          {bs.resetLozinke.potvrdaLozinke}
        </label>
        <input
          id="potvrda"
          name="potvrda"
          type="password"
          autoComplete="new-password"
          required
          value={potvrda}
          onChange={(event) => setPotvrda(event.target.value)}
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
        {saljeSe ? bs.resetLozinke.dugmeUcitavanje : bs.resetLozinke.dugme}
      </button>
    </form>
  );
}
