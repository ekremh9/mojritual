'use server';

import { registerUser, RegisterUserError } from '@/lib/domain/auth';
import { bs } from '@/lib/i18n/bs';

export type RegistracijaRezultat = { ok: true } | { ok: false; error: string };

const MIN_DUZINA_LOZINKE = 8;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function procitajPolje(formData: FormData, naziv: string): string {
  const vrijednost = formData.get(naziv);
  return typeof vrijednost === 'string' ? vrijednost.trim() : '';
}

/**
 * Registruje kupca (role `customer`). Rola se nikad ne čita iz forme —
 * portal za brend i admin imaju svoj tok.
 *
 * Nikad ne baca grešku prema klijentu; svaka greška se vraća kao uređen
 * rezultat sa porukom iz `bs.registracija`.
 */
export async function registerCustomerAction(formData: FormData): Promise<RegistracijaRezultat> {
  const ime = procitajPolje(formData, 'ime');
  const email = procitajPolje(formData, 'email').toLowerCase();
  const lozinka = procitajPolje(formData, 'lozinka');

  if (!ime) {
    return { ok: false, error: bs.registracija.validacija.imeObavezno };
  }

  if (!email) {
    return { ok: false, error: bs.registracija.validacija.emailObavezan };
  }

  if (!EMAIL_FORMAT.test(email)) {
    return { ok: false, error: bs.registracija.validacija.emailNeispravan };
  }

  if (!lozinka) {
    return { ok: false, error: bs.registracija.validacija.lozinkaObavezna };
  }

  if (lozinka.length < MIN_DUZINA_LOZINKE) {
    return { ok: false, error: bs.registracija.validacija.lozinkaKratka };
  }

  try {
    await registerUser({ ime, email, password: lozinka, role: 'customer' });
    return { ok: true };
  } catch (greska) {
    if (greska instanceof RegisterUserError && greska.code === 'email_zauzet') {
      return { ok: false, error: bs.registracija.greskaEmailZauzet };
    }
    console.error('registerCustomerAction: registracija nije uspjela');
    return { ok: false, error: bs.registracija.greskaOpsta };
  }
}
