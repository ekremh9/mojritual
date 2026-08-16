/**
 * Brendovi za admin pregled i odobravanje.
 */
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import type { Brand } from '@/lib/db/schema';

export const BRAND_STATUSI = [
  'na_cekanju',
  'odobren',
  'suspendovan',
] as const satisfies readonly Brand['status'][];

export function jeBrandStatus(vrijednost: string): vrijednost is Brand['status'] {
  return (BRAND_STATUSI as readonly string[]).includes(vrijednost);
}

export type AdminBrend = {
  id: string;
  naziv: string;
  email: string | null;
  status: Brand['status'];
  createdAt: Date;
};

/**
 * Brendovi za admin listu, opciono filtrirani po statusu, najstariji prvo —
 * oni koji čekaju najduže trebaju biti obrađeni prvi.
 */
export async function getBrandsByStatus(statusFilter?: Brand['status']): Promise<AdminBrend[]> {
  const uslov = statusFilter ? eq(brands.status, statusFilter) : undefined;

  return db
    .select({
      id: brands.id,
      naziv: brands.naziv,
      email: brands.email,
      status: brands.status,
      createdAt: brands.createdAt,
    })
    .from(brands)
    .where(uslov)
    .orderBy(asc(brands.createdAt));
}

export type AdminBrendBrojaci = Record<Brand['status'], number>;

/** Broj brendova po svakom statusu — za brojeve uz filter tabove. */
export async function getBrandStatusCounts(): Promise<AdminBrendBrojaci> {
  const redovi = await db.select({ status: brands.status, ukupno: count() }).from(brands).groupBy(brands.status);

  const brojaci: AdminBrendBrojaci = { na_cekanju: 0, odobren: 0, suspendovan: 0 };
  for (const red of redovi) {
    brojaci[red.status] = red.ukupno;
  }
  return brojaci;
}

/** Brend sa svim podacima za admin pregled, bez obzira na status. */
export async function getBrandForAdmin(brandId: string): Promise<Brand | null> {
  const [brend] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
  return brend ?? null;
}

export type AdminBrendStats = { naCekanju: number; odobreno: number };

/** Brojevi za admin pregled — brendova na čekanju i ukupno odobrenih. */
export async function getBrandApprovalStats(): Promise<AdminBrendStats> {
  const [naCekanju] = await db
    .select({ ukupno: count() })
    .from(brands)
    .where(eq(brands.status, 'na_cekanju'));
  const [odobreno] = await db
    .select({ ukupno: count() })
    .from(brands)
    .where(eq(brands.status, 'odobren'));

  return { naCekanju: naCekanju?.ukupno ?? 0, odobreno: odobreno?.ukupno ?? 0 };
}
