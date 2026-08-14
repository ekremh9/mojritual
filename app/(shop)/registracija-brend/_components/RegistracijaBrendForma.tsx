'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerBrandAction } from '@/lib/domain/brand-registration-actions';
import { bs } from '@/lib/i18n/bs';

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20';

const KLASE_LABELE = 'text-sm font-medium text-[#1C2B22]';

const MIN_DUZINA_LOZINKE = 8;
const MIN_DUZINA_NAZIVA_BRENDA = 2;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Polje = 'ime' | 'email' | 'lozinka' | 'potvrda' | 'brandNaziv';
type GreskePolja = Partial<Record<Polje, string>>;

type Vrijednosti = Record<Polje, string>;

function validiraj({ ime, email, lozinka, potvrda, brandNaziv }: Vrijednosti): GreskePolja {
  const greske: GreskePolja = {};
  const poruke = bs.registracijaBrend.validacija;

  if (!ime.trim()) {
    greske.ime = poruke.imeObavezno;
  }

  if (!email.trim()) {
    greske.email = poruke.emailObavezan;
  } else if (!EMAIL_FORMAT.test(email.trim())) {
    greske.email = poruke.emailNeispravan;
  }

  if (!lozinka) {
    greske.lozinka = poruke.lozinkaObavezna;
  } else if (lozinka.length < MIN_DUZINA_LOZINKE) {
    greske.lozinka = poruke.lozinkaKratka;
  }

  if (!potvrda) {
    greske.potvrda = poruke.potvrdaObavezna;
  } else if (potvrda !== lozinka) {
    greske.potvrda = poruke.potvrdaNePoklapa;
  }

  if (!brandNaziv.trim()) {
    greske.brandNaziv = poruke.brandNazivObavezan;
  } else if (brandNaziv.trim().length < MIN_DUZINA_NAZIVA_BRENDA) {
    greske.brandNaziv = poruke.brandNazivKratak;
  }

  return greske;
}

export function RegistracijaBrendForma() {
  const router = useRouter();
  const [vrijednosti, setVrijednosti] = useState<Vrijednosti>({
    ime: '',
    email: '',
    lozinka: '',
    potvrda: '',
    brandNaziv: '',
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
    podaci.set('brandNaziv', vrijednosti.brandNaziv.trim());

    try {
      const rezultat = await registerBrandAction(podaci);

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
        setGreska(bs.registracijaBrend.greskaAutomatskePrijave);
        setSaljeSe(false);
        return;
      }

      // Namjerno ostaje u loading stanju dok navigacija ne završi.
      router.push('/portal');
      router.refresh();
    } catch {
      setGreska(bs.registracijaBrend.greskaOpsta);
      setSaljeSe(false);
    }
  }

  return (
    <form onSubmit={posalji} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ime" className={KLASE_LABELE}>
          {bs.registracijaBrend.ime}
        </label>
        <input
          id="ime"
          name="ime"
          type="text"
          autoComplete="name"
          placeholder={bs.registracijaBrend.imePlaceholder}
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
          {bs.registracijaBrend.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={bs.registracijaBrend.emailPlaceholder}
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
          {bs.registracijaBrend.lozinka}
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
          <p id="lozinka-pomoc" className="text-xs text-[#1C2B22]/60">
            {bs.registracijaBrend.lozinkaPomoc}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="potvrda" className={KLASE_LABELE}>
          {bs.registracijaBrend.potvrdaLozinke}
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="brandNaziv" className={KLASE_LABELE}>
          {bs.registracijaBrend.brandNaziv}
        </label>
        <input
          id="brandNaziv"
          name="brandNaziv"
          type="text"
          autoComplete="organization"
          placeholder={bs.registracijaBrend.brandNazivPlaceholder}
          value={vrijednosti.brandNaziv}
          onChange={(event) => postavi('brandNaziv', event.target.value)}
          disabled={saljeSe}
          aria-invalid={greskePolja.brandNaziv ? true : undefined}
          aria-describedby={greskePolja.brandNaziv ? 'brandNaziv-greska' : undefined}
          className={KLASE_POLJA}
        />
        {greskePolja.brandNaziv ? (
          <p id="brandNaziv-greska" className="text-xs text-[#B3261E]">
            {greskePolja.brandNaziv}
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
        className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#16332A] px-6 py-3 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saljeSe ? bs.registracijaBrend.dugmeUcitavanje : bs.registracijaBrend.dugme}
      </button>
    </form>
  );
}
