/**
 * Forma za dostavu u checkoutu — čista domenska logika, bez React zavisnosti.
 *
 * Isti validator koriste forma na klijentu i server action. Klijentska
 * validacija je samo pogodnost; granica povjerenja je server, koji ovo
 * pušta ponovo nad podacima koje je primio (spec 6).
 */

import { bs } from '@/lib/i18n/bs';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutUnos = {
  ime: string;
  email: string;
  telefon: string;
  adresa: string;
  grad: string;
  postanskiBroj: string;
  napomena: string;
};

export type PoljeCheckouta = keyof CheckoutUnos;
export type GreskeCheckouta = Partial<Record<PoljeCheckouta, string>>;

function tekst(vrijednost: unknown): string {
  return typeof vrijednost === 'string' ? vrijednost.trim() : '';
}

/**
 * Podaci sa klijenta mogu biti bilo šta — action ih prvo provuče kroz ovo,
 * pa tek onda kroz validaciju.
 */
export function normalizujCheckoutUnos(data: unknown): CheckoutUnos {
  const izvor = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;

  return {
    ime: tekst(izvor.ime),
    email: tekst(izvor.email).toLowerCase(),
    telefon: tekst(izvor.telefon),
    adresa: tekst(izvor.adresa),
    grad: tekst(izvor.grad),
    postanskiBroj: tekst(izvor.postanskiBroj),
    napomena: tekst(izvor.napomena),
  };
}

export function validirajCheckoutUnos(unos: CheckoutUnos): GreskeCheckouta {
  const greske: GreskeCheckouta = {};
  const poruke = bs.checkout.forma.validacija;

  if (unos.ime === '') {
    greske.ime = poruke.imeObavezno;
  }

  if (unos.email === '') {
    greske.email = poruke.emailObavezan;
  } else if (!EMAIL_FORMAT.test(unos.email)) {
    greske.email = poruke.emailNeispravan;
  }

  if (unos.telefon === '') {
    greske.telefon = poruke.telefonObavezan;
  }

  if (unos.adresa === '') {
    greske.adresa = poruke.adresaObavezna;
  }

  if (unos.grad === '') {
    greske.grad = poruke.gradObavezan;
  }

  if (unos.postanskiBroj === '') {
    greske.postanskiBroj = poruke.postanskiBrojObavezan;
  }

  return greske;
}
