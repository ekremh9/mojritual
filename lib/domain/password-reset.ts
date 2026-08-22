import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { passwordResetTokens, users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/domain/auth';
import { bs } from '@/lib/i18n/bs';

const TOKEN_TRAJANJE_MS = 60 * 60 * 1000;

/** Generiše kriptografski siguran token i sprema ga s rokom od 1h — kraće od 24h email verifikacije, jer je reset lozinke sigurnosno osjetljiviji. */
export async function generateResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TRAJANJE_MS);

  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });

  return token;
}

export type VerifyResetTokenRezultat =
  | { valid: true; userId: string }
  | { valid: false; error: string };

/**
 * Provjerava token za reset lozinke — NAMJERNO NIJE idempotentan kao
 * `verifyEmailToken` (email-verification.ts).
 *
 * Email verifikacija smije "ponovo uspjeti" na već iskorišten token jer je
 * bezopasno — samo potvrđuje nešto što je već tačno (email jeste
 * verifikovan), a rizik koji se time izbjegava je stvaran: email provajderi
 * automatski otvore link radi sigurnosnog skeniranja prije nego korisnik
 * stigne kliknuti, pa bi striktno jednokratan token slomio taj tok.
 *
 * Reset lozinke nema tu istu sigurnost da se "ponovi" — ako bi drugi posjet
 * na već iskorišten (ali validnog formata) reset-token opet vratio uspjeh,
 * to bi značilo da bilo ko ko dođe do STAROG linka (browser historija,
 * email proslijeđen trećoj strani, log fajl) može ponovo postaviti lozinku
 * korisniku. Zato: već iskorišten token ovdje vraća eksplicitnu grešku, ne
 * uspjeh — mora ostati striktno jednokratan.
 */
export async function verifyResetToken(token: string): Promise<VerifyResetTokenRezultat> {
  const [zapis] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      koristenAt: passwordResetTokens.koristenAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!zapis) {
    return { valid: false, error: bs.resetLozinke.greskaTokenNevazeci };
  }

  if (zapis.koristenAt !== null) {
    return { valid: false, error: bs.resetLozinke.greskaTokenVecIskoristen };
  }

  if (zapis.expiresAt < new Date()) {
    return { valid: false, error: bs.resetLozinke.greskaTokenIstekao };
  }

  return { valid: true, userId: zapis.userId };
}

export type ResetPasswordRezultat = { ok: true } | { ok: false; error: string };

/**
 * Verifikuje token, hashuje novu lozinku, upisuje je na `users.passwordHash`
 * i markira token kao iskorišten. Redoslijed (verifikacija → upis lozinke →
 * markiranje tokena) osigurava da se token ne može ponovo upotrijebiti čim
 * je jednom uspješno iskorišten, u skladu sa `verifyResetToken` iznad.
 */
export async function resetPassword(token: string, novaLozinka: string): Promise<ResetPasswordRezultat> {
  const provjera = await verifyResetToken(token);

  if (!provjera.valid) {
    return { ok: false, error: provjera.error };
  }

  const passwordHash = await hashPassword(novaLozinka);
  const sada = new Date();

  await db.update(users).set({ passwordHash }).where(eq(users.id, provjera.userId));
  await db
    .update(passwordResetTokens)
    .set({ koristenAt: sada })
    .where(eq(passwordResetTokens.token, token));

  return { ok: true };
}
