'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerCustomerAction } from '@/lib/domain/auth-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-ritual-charcoal/15 bg-white px-4 py-2.5 text-sm text-ritual-charcoal outline-none transition placeholder:text-ritual-charcoal/40 focus:border-ritual-deep-green focus:ring-2 focus:ring-ritual-deep-green/20';

const KLASE_LABELE = 'text-sm font-medium text-ritual-charcoal';

const MIN_DUZINA_LOZINKE = 8;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Polje = 'ime' | 'email' | 'lozinka' | 'potvrda';
type GreskePolja = Partial<Record<Polje, string>>;

type Vrijednosti = Record<Polje, string>;

function validiraj({ ime, email, lozinka, potvrda }: Vrijednosti): GreskePolja {
  const greske: GreskePolja = {};

  if (!ime.trim()) {
    greske.ime = bs.registracija.validacija.imeObavezno;
  }

  if (!email.trim()) {
    greske.email = bs.registracija.validacija.emailObavezan;
  } else if (!EMAIL_FORMAT.test(email.trim())) {
    greske.email = bs.registracija.validacija.emailNeispravan;
  }

  if (!lozinka) {
    greske.lozinka = bs.registracija.validacija.lozinkaObavezna;
  } else if (lozinka.length < MIN_DUZINA_LOZINKE) {
    greske.lozinka = bs.registracija.validacija.lozinkaKratka;
  }

  if (!potvrda) {
    greske.potvrda = bs.registracija.validacija.potvrdaObavezna;
  } else if (potvrda !== lozinka) {
    greske.potvrda = bs.registracija.validacija.potvrdaNePoklapa;
  }

  return greske;
}

export function RegistracijaForma() {
  const router = useRouter();
  const [vrijednosti, setVrijednosti] = useState<Vrijednosti>({
    ime: '',
    email: '',
    lozinka: '',
    potvrda: '',
  });
  const [greskePolja, setGreskePolja] = useState<GreskePolja>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  function postavi(polje: Polje, vrijednost: string) {
    setVrijednosti((prethodne) => ({ ...prethodne, [polje]: vrijednost }));
  }

  async function posalji(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGreska(null);

    const greske = validiraj(vrijednosti);
    setGreskePolja(greske);

    if (Object.keys(greske).length > 0) {
      return;
    }

    setSaljeSe(true);

    const email = vrijednosti.email.trim().toLowerCase();
    const podaci = new FormData();
    podaci.set('ime', vrijednosti.ime.trim());
    podaci.set('email', email);
    podaci.set('lozinka', vrijednosti.lozinka);

    try {
      const rezultat = await registerCustomerAction(podaci);

      if (!rezultat.ok) {
        setGreska(rezultat.error);
        setSaljeSe(false);
        return;
      }

      const prijava = await signIn('credentials', {
        email,
        password: vrijednosti.lozinka,
        redirect: false,
      });

      if (!prijava || prijava.error) {
        setGreska(bs.registracija.greskaAutomatskePrijave);
        setSaljeSe(false);
        return;
      }

      // Namjerno ostaje u loading stanju dok navigacija ne završi.
      router.push('/');
      router.refresh();
    } catch {
      setGreska(bs.registracija.greskaOpsta);
      setSaljeSe(false);
    }
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ime" className={KLASE_LABELE}>
          {bs.registracija.ime}
        </label>
        <input
          id="ime"
          name="ime"
          type="text"
          autoComplete="name"
          placeholder={bs.registracija.imePlaceholder}
          value={vrijednosti.ime}
          onChange={(event) => postavi('ime', event.target.value)}
          disabled={saljeSe}
          aria-invalid={greskePolja.ime ? true : undefined}
          aria-describedby={greskePolja.ime ? 'ime-greska' : undefined}
          className={KLASE_POLJA}
        />
        {greskePolja.ime ? (
          <p id="ime-greska" className="text-xs text-[#B3261E]">
            {greskePolja.ime}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={KLASE_LABELE}>
          {bs.registracija.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={bs.registracija.emailPlaceholder}
          value={vrijednosti.email}
          onChange={(event) => postavi('email', event.target.value)}
          disabled={saljeSe}
          aria-invalid={greskePolja.email ? true : undefined}
          aria-describedby={greskePolja.email ? 'email-greska' : undefined}
          className={KLASE_POLJA}
        />
        {greskePolja.email ? (
          <p id="email-greska" className="text-xs text-[#B3261E]">
            {greskePolja.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="lozinka" className={KLASE_LABELE}>
          {bs.registracija.lozinka}
        </label>
        <input
          id="lozinka"
          name="lozinka"
          type="password"
          autoComplete="new-password"
          value={vrijednosti.lozinka}
          onChange={(event) => postavi('lozinka', event.target.value)}
          disabled={saljeSe}
          aria-invalid={greskePolja.lozinka ? true : undefined}
          aria-describedby={greskePolja.lozinka ? 'lozinka-greska' : 'lozinka-pomoc'}
          className={KLASE_POLJA}
        />
        {greskePolja.lozinka ? (
          <p id="lozinka-greska" className="text-xs text-[#B3261E]">
            {greskePolja.lozinka}
          </p>
        ) : (
          <p id="lozinka-pomoc" className="text-xs text-ritual-charcoal/60">
            {bs.registracija.lozinkaPomoc}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="potvrda" className={KLASE_LABELE}>
          {bs.registracija.potvrdaLozinke}
        </label>
        <input
          id="potvrda"
          name="potvrda"
          type="password"
          autoComplete="new-password"
          value={vrijednosti.potvrda}
          onChange={(event) => postavi('potvrda', event.target.value)}
          disabled={saljeSe}
          aria-invalid={greskePolja.potvrda ? true : undefined}
          aria-describedby={greskePolja.potvrda ? 'potvrda-greska' : undefined}
          className={KLASE_POLJA}
        />
        {greskePolja.potvrda ? (
          <p id="potvrda-greska" className="text-xs text-[#B3261E]">
            {greskePolja.potvrda}
          </p>
        ) : null}
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
        {saljeSe ? bs.registracija.dugmeUcitavanje : bs.registracija.dugme}
      </button>
    </form>
  );
}
