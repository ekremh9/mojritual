import { createElement } from 'react';
import { generateVerificationToken } from '@/lib/domain/email-verification';
import { EMAIL_FROM, resendClient } from '@/lib/email/resend-client';
import { PotvrdaNarudzbeEmail } from '@/lib/email/templates/PotvrdaNarudzbeEmail';
import { PotvrdaRegistracijeEmail } from '@/lib/email/templates/PotvrdaRegistracijeEmail';

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
      subject: 'Dobrodošli na Ritual',
      react: createElement(PotvrdaRegistracijeEmail, { ime, linkZaVerifikaciju }),
    });
  } catch {
    console.error('sendRegistrationEmail: slanje emaila nije uspjelo');
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
      subject: `Potvrda narudžbe ${brojNarudzbe}`,
      react: createElement(PotvrdaNarudzbeEmail, { kupacIme, brojNarudzbe, stavke, ukupno }),
    });
  } catch {
    console.error('sendOrderConfirmationEmail: slanje emaila nije uspjelo');
  }
}
