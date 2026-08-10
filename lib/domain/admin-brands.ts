/**
 * Brendovi za admin pregled i odobravanje.
 */
import { asc, count, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands } from '@/lib/db/schema';
import type { Brand } from '@/lib/db/schema';

export type AdminBrendNaCekanju = {
  id: string;
  naziv: string;
  email: string | null;
  createdAt: Date;
};

/** Brendovi na čekanju, najstariji prvo — oni čekaju najduže. */
export async function getPendingBrands(): Promise<AdminBrendNaCekanju[]> {
  return db
    .select({
      id: brands.id,
      naziv: brands.naziv,
      email: brands.email,
      createdAt: brands.createdAt,
    })
    .from(brands)
    .where(eq(brands.status, 'na_cekanju'))
    .orderBy(asc(brands.createdAt));
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
