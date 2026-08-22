'use server';

/**
 * Svi korisnici platforme za admin pregled — read-only, plus admin prečica
 * za slanje linka za reset lozinke.
 *
 * Fajl je NAMJERNO 'use server' na nivou cijelog fajla, ne samo pojedinačne
 * funkcije — `SendResetLozinkeDugme.tsx` (klijentska komponenta) uvozi
 * `sendPasswordResetAsAdminAction` odavde, a Next treba file-level direktivu
 * da ispravno izdvoji server-only kod (uključujući `db`/`postgres`) iz
 * klijentskog bundle-a; per-function direktiva na samo jednoj funkciji nije
 * dovoljna dok god ISTI fajl ima i druge top-level importe (`db`) koje
 * bundler inače pokuša razriješiti i za klijenta (vidi build grešku koju je
 * ovo popravilo — 'tls'/'net' module-not-found iz `postgres` paketa).
 *
 * POSLJEDICA: pošto je cijeli fajl 'use server', SVAKA exportovana funkcija
 * (uključujući `getAllUsers`) postaje mrežno pozivljiva iz klijenta, bez
 * obzira što je `getAllUsers` zamišljen da ga poziva samo server komponenta
 * (admin/korisnici/page.tsx). Zato `getAllUsers` sad ima SVOJU admin
 * provjeru ispod — ranije se oslanjao isključivo na to da ga poziva stranica
 * iza `app/admin/layout.tsx` gate-a, što više nije dovoljno.
 */
import { count, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brandUsers, brands, orders, users } from '@/lib/db/schema';
import type { Brand, User } from '@/lib/db/schema';
import { generateResetToken } from '@/lib/domain/password-reset';
import { sendPasswordResetEmail } from '@/lib/email/send';
import { bs } from '@/lib/i18n/bs';

export type AdminKorisnikPartner = {
  naziv: string;
  status: Brand['status'];
};

export type AdminKorisnik = {
  id: string;
  ime: string | null;
  email: string;
  role: User['role'];
  createdAt: Date;
  brojNarudzbi: number;
  partner: AdminKorisnikPartner | null;
};

/**
 * Svi korisnici, najnoviji prvo. `limit`/`offset` opciono — trenutni broj
 * korisnika je mali pa stranica poziva bez njih (cijela lista), ali upit je
 * spreman za paginaciju kad zatreba.
 */
export async function getAllUsers(limit?: number, offset?: number): Promise<AdminKorisnik[]> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return [];
  }

  let upit = db
    .select({
      id: users.id,
      ime: users.ime,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .$dynamic();

  if (limit !== undefined) {
    upit = upit.limit(limit);
  }
  if (offset !== undefined) {
    upit = upit.offset(offset);
  }

  const korisnici = await upit;

  if (korisnici.length === 0) {
    return [];
  }

  const userIds = korisnici.map((korisnik) => korisnik.id);

  const [brojaciNarudzbi, partnerRedovi] = await Promise.all([
    db
      .select({ userId: orders.userId, ukupno: count() })
      .from(orders)
      .where(inArray(orders.userId, userIds))
      .groupBy(orders.userId),
    db
      .select({ userId: brandUsers.userId, naziv: brands.naziv, status: brands.status })
      .from(brandUsers)
      .innerJoin(brands, eq(brandUsers.brandId, brands.id))
      .where(inArray(brandUsers.userId, userIds)),
  ]);

  const brojNarudzbiPoKorisniku = new Map<string, number>();
  for (const red of brojaciNarudzbi) {
    if (red.userId) {
      brojNarudzbiPoKorisniku.set(red.userId, red.ukupno);
    }
  }

  // Trenutni model pretpostavlja NAJVIŠE JEDAN brand_users red po korisniku.
  // Ako se ikad dozvoli više korisnika po istom partneru (planirano
  // proširenje), ovaj upit i dalje neće pući — Map.has ispod zadrži samo
  // PRVI red po korisniku, ne pokušava spojiti/prikazati sve.
  const partnerPoKorisniku = new Map<string, AdminKorisnikPartner>();
  for (const red of partnerRedovi) {
    if (!partnerPoKorisniku.has(red.userId)) {
      partnerPoKorisniku.set(red.userId, { naziv: red.naziv, status: red.status });
    }
  }

  return korisnici.map((korisnik) => ({
    ...korisnik,
    brojNarudzbi: brojNarudzbiPoKorisniku.get(korisnik.id) ?? 0,
    partner: partnerPoKorisniku.get(korisnik.id) ?? null,
  }));
}

export type AdminResetLozinkeRezultat = { ok: true } | { ok: false; error: string };

/**
 * Šalje email za reset lozinke UMJESTO korisnika — admin prečica (npr. kad
 * korisnik zove podršku jer je zaboravio lozinku i nema pristup emailu da
 * sam pokrene tok na /zaboravljena-lozinka).
 *
 * Odbija admin naloge kao METU — admin ne smije kroz ovaj UI pokrenuti
 * reset TUĐEG admin naloga (self-service /zaboravljena-lozinka ostaje
 * jedini put za to, van admin panela). Provjera je ovdje, na serveru, ne
 * samo u UI-ju koji dugme sakriva za admin redove — server je granica
 * povjerenja.
 */
export async function sendPasswordResetAsAdminAction(
  userId: string,
): Promise<AdminResetLozinkeRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [korisnik] = await db
      .select({ id: users.id, email: users.email, ime: users.ime, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!korisnik) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (korisnik.role === 'admin') {
      return { ok: false, error: bs.admin.korisnici.resetLozinke.greskaAdminNalog };
    }

    const token = await generateResetToken(korisnik.id);
    await sendPasswordResetEmail(korisnik.email, korisnik.ime ?? '', token);

    return { ok: true };
  } catch {
    console.error('sendPasswordResetAsAdminAction: slanje reset linka nije uspjelo');
    return { ok: false, error: bs.admin.korisnici.resetLozinke.greskaOpsta };
  }
}
