import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailVerificationTokens, users } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

const TOKEN_TRAJANJE_MS = 24 * 60 * 60 * 1000;

/** Generiše kriptografski siguran token i sprema ga s rokom od 24h. */
export async function generateVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TRAJANJE_MS);

  await db.insert(emailVerificationTokens).values({ userId, token, expiresAt });

  return token;
}

export type VerifyEmailTokenRezultat = { ok: true } | { ok: false; error: string };

/**
 * Provjerava token i postavlja `users.email_verifikovan_at`. Idempotentno —
 * token se NIKAD ne briše, samo označi `koristenAt` pri prvoj upotrebi.
 *
 * Razlog: email provajderi (Gmail i slični) često automatski otvore link iz
 * emaila radi sigurnosnog skeniranja, prije nego korisnik stigne ručno
 * kliknuti. Da se token brisao pri prvoj upotrebi, taj automatski posjet bi
 * ga potrošio i korisnikov stvarni klik bi vidio grešku iako je email već
 * verifikovan. Drugi/treći posjet na već iskorišten (ali nemogući za
 * pogoditi) token zato vraća uspjeh, ne grešku.
 */
export async function verifyEmailToken(token: string): Promise<VerifyEmailTokenRezultat> {
  const [zapis] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
      koristenAt: emailVerificationTokens.koristenAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!zapis) {
    return { ok: false, error: bs.verifikacija.greskaNevazeci };
  }

  if (zapis.koristenAt !== null) {
    return { ok: true };
  }

  if (zapis.expiresAt < new Date()) {
    return { ok: false, error: bs.verifikacija.greskaIstekao };
  }

  const sada = new Date();
  const [korisnik] = await db
    .select({ emailVerifikovanAt: users.emailVerifikovanAt })
    .from(users)
    .where(eq(users.id, zapis.userId))
    .limit(1);

  if (korisnik && korisnik.emailVerifikovanAt === null) {
    await db.update(users).set({ emailVerifikovanAt: sada }).where(eq(users.id, zapis.userId));
  }

  await db
    .update(emailVerificationTokens)
    .set({ koristenAt: sada })
    .where(eq(emailVerificationTokens.id, zapis.id));

  return { ok: true };
}
