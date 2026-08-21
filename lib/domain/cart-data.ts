'use server';

/**
 * Server-side dohvat podataka za korpu. Klijent šalje samo productId/kolicina
 * (vidi `lib/cart/CartContext.tsx`) — cijena i ostali podaci uvijek dolaze
 * odavde, direktno iz baze, nikad iz localStorage.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brands, productImages, products, wholesalePriceTiers } from '@/lib/db/schema';
import { jeOdobreniPartner } from '@/lib/domain/brand-access';
import type { KorpaProizvod } from '@/lib/domain/cart';

/**
 * Vraća samo proizvode statusa `odobren` čiji je brend takođe `odobren`.
 * Proizvod koji je u međuvremenu povučen/odbijen, ili čiji brend još nije
 * odobren, se jednostavno ne vrati — stranica korpe ga tretira kao
 * nedostajući (`nedostajuciIds`).
 *
 * `jePartner` se izvodi ISKLJUČIVO iz `auth()` sesije, ovdje na serveru —
 * ova funkcija se poziva direktno iz klijentskih komponenti (`korpa/page.tsx`,
 * `checkout/page.tsx`) kao server action, pa nema (i ne smije biti) parametra
 * koji bi klijent mogao poslati da tvrdi da je partner. Kad `jePartner` nije
 * `true`, `wholesale_price_tiers` se uopšte ne dohvata (ne samo da se ne
 * vraća) — veleprodajne cijene se ne otkrivaju neovlaštenim korisnicima ni
 * kroz mrežni odgovor.
 */
export async function getCartProductsData(productIds: string[]): Promise<KorpaProizvod[]> {
  if (productIds.length === 0) {
    return [];
  }

  const session = await auth();
  const jePartner = session?.user?.id ? await jeOdobreniPartner(session.user.id) : false;

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

  const [slike, wholesalePragoviRedovi] = await Promise.all([
    db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        alt: productImages.alt,
      })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.redoslijed)),
    jePartner
      ? db
          .select({
            productId: wholesalePriceTiers.productId,
            minKolicina: wholesalePriceTiers.minKolicina,
            popustPosto: wholesalePriceTiers.popustPosto,
          })
          .from(wholesalePriceTiers)
          .where(inArray(wholesalePriceTiers.productId, ids))
          .orderBy(asc(wholesalePriceTiers.minKolicina))
      : Promise.resolve([]),
  ]);

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  const pragoviPoProizvodu = new Map<string, { minKolicina: number; popustPosto: number }[]>();
  for (const red of wholesalePragoviRedovi) {
    const lista = pragoviPoProizvodu.get(red.productId) ?? [];
    lista.push({ minKolicina: red.minKolicina, popustPosto: Number(red.popustPosto) });
    pragoviPoProizvodu.set(red.productId, lista);
  }

  return redovi.map((red) => ({
    id: red.id,
    slug: red.slug,
    naziv: red.naziv,
    cijena: red.cijena,
    pragovi: jePartner ? (pragoviPoProizvodu.get(red.id) ?? []) : undefined,
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
