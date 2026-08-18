import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { guideSessions, orders } from '@/lib/db/schema';
import type { Order } from '@/lib/db/schema';

export type NalogPregled = {
  brojNarudzbi: number;
  brojSacuvanihVodica: number;
};

/**
 * Brojevi za pregled "Moj nalog" — narudžbe i sačuvani rezultati Vodiča.
 *
 * `userId` MORA doći iz `auth()` sesije pozivaoca — ova funkcija ga samo
 * koristi kao filter, ne provjerava odakle je došao. Nikad je ne pozivati
 * sa vrijednošću koja dolazi direktno od klijenta (query/body parametar),
 * jer bi to otvorilo uvid u tuđe narudžbe/rezultate.
 */
export async function getNalogPregled(userId: string): Promise<NalogPregled> {
  const [narudzbe] = await db.select({ ukupno: count() }).from(orders).where(eq(orders.userId, userId));

  const [vodic] = await db
    .select({ ukupno: count() })
    .from(guideSessions)
    .where(and(eq(guideSessions.userId, userId), eq(guideSessions.sacuvano, true)));

  return {
    brojNarudzbi: narudzbe?.ukupno ?? 0,
    brojSacuvanihVodica: vodic?.ukupno ?? 0,
  };
}

export type MojaNarudzba = {
  broj: string;
  createdAt: Date;
  status: Order['status'];
  ukupno: number;
};

/**
 * Sve narudžbe prijavljenog korisnika, najnovije prvo.
 *
 * `userId` MORA doći iz `auth()` sesije pozivaoca — isto pravilo kao
 * `getNalogPregled`. Nikad je ne pozivati sa vrijednošću sa klijenta.
 */
export async function getMojeNarudzbe(userId: string): Promise<MojaNarudzba[]> {
  return db
    .select({
      broj: orders.broj,
      createdAt: orders.createdAt,
      status: orders.status,
      ukupno: orders.ukupno,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}
