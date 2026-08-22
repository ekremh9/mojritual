import { createElement } from 'react';
import { generateVerificationToken } from '@/lib/domain/email-verification';
import { EMAIL_FROM, resendClient } from '@/lib/email/resend-client';
import { PotvrdaNarudzbeEmail } from '@/lib/email/templates/PotvrdaNarudzbeEmail';
import { PotvrdaRegistracijeEmail } from '@/lib/email/templates/PotvrdaRegistracijeEmail';
import { ResetLozinkeEmail } from '@/lib/email/templates/ResetLozinkeEmail';
import { bs } from '@/lib/i18n/bs';

const SUPPORT_EMAIL = bs.footer.kontakt.email;

/**
 * Slanje emaila nikad ne smije oboriti glavnu radnju (registraciju,
 * narudžbu) — svaka funkcija ovdje hvata sve greške interno i nikad ih ne
 * baca dalje. Greška se samo zabilježi, bez email adrese ili imena u logu
 * (CLAUDE.md pravilo 4).
 */
export async function sendRegistrationEmail(
  userId: string,
  email: string,
  ime: string,
): Promise<void> {
  try {
    const token = await generateVerificationToken(userId);
    const linkZaVerifikaciju = `${process.env.APP_URL}/verifikuj-email?token=${token}`;

    await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Dobrodošli na Ritual',
      react: createElement(PotvrdaRegistracijeEmail, { ime, linkZaVerifikaciju }),
    });
  } catch {
    console.error('sendRegistrationEmail: slanje emaila nije uspjelo');
  }
}

/** Token se generiše VAN ove funkcije (pozivalac odlučuje self-service ili admin tok) i prosljeđuje se ovdje već gotov. */
export async function sendPasswordResetEmail(email: string, ime: string, token: string): Promise<void> {
  try {
    const linkZaReset = `${process.env.APP_URL}/reset-lozinke?token=${token}`;

    await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: 'Reset lozinke na Ritualu',
      react: createElement(ResetLozinkeEmail, { ime, linkZaReset }),
    });
  } catch {
    console.error('sendPasswordResetEmail: slanje emaila nije uspjelo');
  }
}

export async function sendOrderConfirmationEmail(
  email: string,
  kupacIme: string,
  brojNarudzbe: string,
  stavke: { naziv: string; kolicina: number; cijena: string }[],
  ukupno: string,
): Promise<void> {
  try {
    await resendClient.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: SUPPORT_EMAIL,
      subject: `Potvrda narudžbe ${brojNarudzbe}`,
      react: createElement(PotvrdaNarudzbeEmail, { kupacIme, brojNarudzbe, stavke, ukupno }),
    });
  } catch {
    console.error('sendOrderConfirmationEmail: slanje emaila nije uspjelo');
  }
}
