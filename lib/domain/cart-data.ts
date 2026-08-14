'use server';

/**
 * Server-side dohvat podataka za korpu. Klijent šalje samo productId/kolicina
 * (vidi `lib/cart/CartContext.tsx`) — cijena i ostali podaci uvijek dolaze
 * odavde, direktno iz baze, nikad iz localStorage.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { brands, productImages, products } from '@/lib/db/schema';
import type { KorpaProizvod } from '@/lib/domain/cart';

/**
 * Vraća samo proizvode statusa `odobren` čiji je brend takođe `odobren`.
 * Proizvod koji je u međuvremenu povučen/odbijen, ili čiji brend još nije
 * odobren, se jednostavno ne vrati — stranica korpe ga tretira kao
 * nedostajući (`nedostajuciIds`).
 */
export async function getCartProductsData(productIds: string[]): Promise<KorpaProizvod[]> {
  if (productIds.length === 0) {
    return [];
  }

  const redovi = await db
    .select({
      id: products.id,
      slug: products.slug,
      naziv: products.naziv,
      cijena: products.cijena,
      brendId: brands.id,
      brendSlug: brands.slug,
      brendNaziv: brands.naziv,
      brendCijenaDostave: brands.cijenaDostave,
      brendPragBesplatneDostave: brands.pragBesplatneDostave,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(
      and(
        inArray(products.id, productIds),
        eq(products.status, 'odobren'),
        eq(brands.status, 'odobren'),
      ),
    );

  if (redovi.length === 0) {
    return [];
  }

  const ids = redovi.map((red) => red.id);

  const slike = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
    })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  return redovi.map((red) => ({
    id: red.id,
    slug: red.slug,
    naziv: red.naziv,
    cijena: red.cijena,
    slika: prvaSlikaPoProizvodu.get(red.id) ?? null,
    brend: {
      id: red.brendId,
      slug: red.brendSlug,
      naziv: red.brendNaziv,
      cijenaDostave: red.brendCijenaDostave,
      pragBesplatneDostave: red.brendPragBesplatneDostave,
    },
  }));
}
