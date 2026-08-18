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
 * Provjerava token, postavlja `users.email_verifikovan_at` i briše iskorišteni
 * token. Nevažeći i istekli token vraćaju istu poruku — ne otkriva pozivaocu
 * da li je token ikad postojao.
 */
export async function verifyEmailToken(token: string): Promise<VerifyEmailTokenRezultat> {
  const [zapis] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!zapis) {
    return { ok: false, error: bs.verifikacija.greska };
  }

  if (zapis.expiresAt < new Date()) {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, zapis.id));
    return { ok: false, error: bs.verifikacija.greska };
  }

  await db.update(users).set({ emailVerifikovanAt: new Date() }).where(eq(users.id, zapis.userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, zapis.id));

  return { ok: true };
}
