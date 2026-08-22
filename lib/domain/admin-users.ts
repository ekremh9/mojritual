/**
 * Svi korisnici platforme za admin pregled — read-only.
 */
import { count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brandUsers, brands, orders, users } from '@/lib/db/schema';
import type { Brand, User } from '@/lib/db/schema';

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
