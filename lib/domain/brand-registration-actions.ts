'use server';

import { BrandRegistrationError, registerBrandOwner } from '@/lib/domain/brand-registration';
import { bs } from '@/lib/i18n/bs';

export type RegistracijaBrendRezultat = { ok: true } | { ok: false; error: string };

const MIN_DUZINA_LOZINKE = 8;
const MIN_DUZINA_NAZIVA_BRENDA = 2;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function procitajPolje(formData: FormData, naziv: string): string {
  const vrijednost = formData.get(naziv);
  return typeof vrijednost === 'string' ? vrijednost.trim() : '';
}

/**
 * Registruje vlasnika brenda (role `brand`) i sam brend, status `na_cekanju`
 * dok admin ne odobri (spec 10.4). Rola se nikad ne čita iz forme.
 *
 * Nikad ne baca grešku prema klijentu; svaka greška se vraća kao uređen
 * rezultat sa porukom iz `bs.registracijaBrend`.
 */
export async function registerBrandAction(
  formData: FormData,
): Promise<RegistracijaBrendRezultat> {
  const poruke = bs.registracijaBrend;

  const ime = procitajPolje(formData, 'ime');
  const email = procitajPolje(formData, 'email').toLowerCase();
  const lozinka = procitajPolje(formData, 'lozinka');
  const brandNaziv = procitajPolje(formData, 'brandNaziv');

  if (!ime) {
    return { ok: false, error: poruke.validacija.imeObavezno };
  }

  if (!email) {
    return { ok: false, error: poruke.validacija.emailObavezan };
  }

  if (!EMAIL_FORMAT.test(email)) {
    return { ok: false, error: poruke.validacija.emailNeispravan };
  }

  if (!lozinka) {
    return { ok: false, error: poruke.validacija.lozinkaObavezna };
  }

  if (lozinka.length < MIN_DUZINA_LOZINKE) {
    return { ok: false, error: poruke.validacija.lozinkaKratka };
  }

  if (!brandNaziv) {
    return { ok: false, error: poruke.validacija.brandNazivObavezan };
  }

  if (brandNaziv.length < MIN_DUZINA_NAZIVA_BRENDA) {
    return { ok: false, error: poruke.validacija.brandNazivKratak };
  }

  try {
    await registerBrandOwner({ ime, email, password: lozinka, brandNaziv });
    return { ok: true };
  } catch (greska) {
    if (greska instanceof BrandRegistrationError && greska.code === 'email_zauzet') {
      return { ok: false, error: poruke.greskaEmailZauzet };
    }

    // Bez detalja i bez ličnih podataka kontakt osobe u logu.
    console.error('registerBrandAction: registracija brenda nije uspjela');
    return { ok: false, error: poruke.greskaOpsta };
  }
}
