import { cache } from 'react';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brandUsers, brands, brandWholesaleDefaults } from '@/lib/db/schema';
import type { Brand, BrandUser } from '@/lib/db/schema';
import type { WholesalePrag } from '@/lib/domain/wholesale-tiers';

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

/**
 * Da li je korisnik povezan sa ODOBRENIM partnerom (`brands.status =
 * 'odobren'`) — bilo kao vlasnik ili urednik (isti tretman kao svugdje
 * drugo u portalu, npr. `saveProductAction`: obje uloge pripadaju
 * brendu). Reusuje `getUserBrand`, ne duplira upit. Koristi ga npr.
 * `VeleprodajaBaner` da razlikuje partnera od gosta/kupca.
 */
export async function jeOdobreniPartner(userId: string): Promise<boolean> {
  const pristup = await getUserBrand(userId);
  return pristup !== null && pristup.brand.status === 'odobren';
}

/**
 * Podrazumijevani veleprodajni pragovi partnera (`brand_wholesale_defaults`),
 * sortirano po `minKolicina` — prečica za popunjavanje forme proizvoda
 * ("Primijeni podrazumijevane pragove"), ne izvor istine za narudžbu.
 */
export async function getBrandWholesaleDefaults(brandId: string): Promise<WholesalePrag[]> {
  const redovi = await db
    .select({
      minKolicina: brandWholesaleDefaults.minKolicina,
      popustPosto: brandWholesaleDefaults.popustPosto,
    })
    .from(brandWholesaleDefaults)
    .where(eq(brandWholesaleDefaults.brandId, brandId))
    .orderBy(asc(brandWholesaleDefaults.minKolicina));

  return redovi.map((red) => ({
    minKolicina: red.minKolicina,
    popustPosto: Number(red.popustPosto),
  }));
}
