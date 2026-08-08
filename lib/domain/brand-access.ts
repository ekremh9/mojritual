import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brandUsers, brands } from '@/lib/db/schema';
import type { Brand, BrandUser } from '@/lib/db/schema';

export type BrandPristup = {
  brand: Brand;
  uloga: BrandUser['uloga'];
};

/**
 * Brend povezan s korisnikom, kroz `brand_users`.
 *
 * Za sada jedan korisnik pripada jednom brendu — ako ih ima više, uzima se
 * prvi. Vraća `null` kad nalog nije povezan ni sa jednim brendom (npr. admin
 * koji otvori portal, ili brend nalog prije nego ga admin poveže).
 *
 * Ovo je izvor istine za pristup portalu: proxy provjerava samo rolu, a
 * granicu „koji brend" postavlja ova funkcija. Svaka stranica portala mora
 * kroz nju — brend nikad ne smije vidjeti tuđe podatke (spec 10.3).
 */
export const getUserBrand = cache(async (userId: string): Promise<BrandPristup | null> => {
  const redovi = await db
    .select({ brand: brands, uloga: brandUsers.uloga })
    .from(brandUsers)
    .innerJoin(brands, eq(brandUsers.brandId, brands.id))
    .where(eq(brandUsers.userId, userId))
    .limit(1);

  return redovi[0] ?? null;
});
