'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { registerUser, RegisterUserError } from '@/lib/domain/auth';
import { generateResetToken, resetPassword } from '@/lib/domain/password-reset';
import { sendPasswordResetEmail, sendRegistrationEmail } from '@/lib/email/send';
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
    const noviKorisnik = await registerUser({ ime, email, password: lozinka, role: 'customer' });
    await sendRegistrationEmail(noviKorisnik.id, email, ime);
    return { ok: true };
  } catch (greska) {
    if (greska instanceof RegisterUserError && greska.code === 'email_zauzet') {
      return { ok: false, error: bs.registracija.greskaEmailZauzet };
    }
    console.error('registerCustomerAction: registracija nije uspjela');
    return { ok: false, error: bs.registracija.greskaOpsta };
  }
}

export type ZaboravljenaLozinkaRezultat = { ok: true } | { ok: false; error: string };

/**
 * UVIJEK vraća isti uspjeh, bez obzira postoji li email u sistemu — jedina
 * grana koja vraća grešku je neispravan FORMAT unosa (npr. "abc"), što ne
 * otkriva ništa o postojanju naloga, samo o obliku unosa. Čak i neočekivana
 * greška (npr. baza nedostupna) se hvata i i dalje vraća isti uspjeh — da
 * razlika u odgovoru nikad ne postane kanal za enumeraciju naloga.
 */
export async function requestPasswordResetAction(
  formData: FormData,
): Promise<ZaboravljenaLozinkaRezultat> {
  const email = procitajPolje(formData, 'email').toLowerCase();

  if (!email) {
    return { ok: false, error: bs.zaboravljenaLozinka.validacija.emailObavezan };
  }

  if (!EMAIL_FORMAT.test(email)) {
    return { ok: false, error: bs.zaboravljenaLozinka.validacija.emailNeispravan };
  }

  try {
    const [korisnik] = await db
      .select({ id: users.id, ime: users.ime })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (korisnik) {
      const token = await generateResetToken(korisnik.id);
      await sendPasswordResetEmail(email, korisnik.ime ?? '', token);
    }

    return { ok: true };
  } catch {
    console.error('requestPasswordResetAction: zahtjev za reset nije uspio');
    return { ok: true };
  }
}

export type ResetLozinkeRezultat = { ok: true } | { ok: false; error: string };

/** Validira formu pa poziva `resetPassword` (koji sam ponovo verifikuje token — vidi password-reset.ts). */
export async function resetPasswordAction(formData: FormData): Promise<ResetLozinkeRezultat> {
  const token = procitajPolje(formData, 'token');
  const lozinka = procitajPolje(formData, 'lozinka');
  const potvrda = procitajPolje(formData, 'potvrda');

  if (!token) {
    return { ok: false, error: bs.resetLozinke.greskaTokenNevazeci };
  }

  if (!lozinka) {
    return { ok: false, error: bs.resetLozinke.validacija.lozinkaObavezna };
  }

  if (lozinka.length < MIN_DUZINA_LOZINKE) {
    return { ok: false, error: bs.resetLozinke.validacija.lozinkaKratka };
  }

  if (!potvrda) {
    return { ok: false, error: bs.resetLozinke.validacija.potvrdaObavezna };
  }

  if (potvrda !== lozinka) {
    return { ok: false, error: bs.resetLozinke.validacija.potvrdaNePoklapa };
  }

  try {
    return await resetPassword(token, lozinka);
  } catch {
    console.error('resetPasswordAction: reset lozinke nije uspio');
    return { ok: false, error: bs.resetLozinke.greskaOpsta };
  }
}
