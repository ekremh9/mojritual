'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, like, or } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brandUsers, brands, productCategories, products } from '@/lib/db/schema';
import { normalizujProizvod, pripremiProizvod, validirajProizvod } from '@/lib/domain/product-form';
import { generisiSlug } from '@/lib/domain/slug';
import { bs } from '@/lib/i18n/bs';

export type PortalProizvodRezultat =
  | { ok: true; productId: string }
  | { ok: false; error: string };

const CILJNI_STATUSI = ['nacrt', 'na_cekanju'] as const;
type CiljniStatus = (typeof CILJNI_STATUSI)[number];

function jeCiljniStatus(vrijednost: unknown): vrijednost is CiljniStatus {
  return typeof vrijednost === 'string' && (CILJNI_STATUSI as readonly string[]).includes(vrijednost);
}

/** Dodaje broj kad se osnovni slug poklapa sa postojećim (`naziv`, `naziv-2`, ...). */
async function osiguraJedinstvenSlug(baza: string): Promise<string> {
  const postojeci = await db
    .select({ slug: products.slug })
    .from(products)
    .where(or(eq(products.slug, baza), like(products.slug, `${baza}-%`)));

  const zauzeti = new Set(postojeci.map((red) => red.slug));
  if (!zauzeti.has(baza)) {
    return baza;
  }

  let broj = 2;
  while (zauzeti.has(`${baza}-${broj}`)) {
    broj += 1;
  }
  return `${baza}-${broj}`;
}

/**
 * Snima proizvod iz portala brenda — insert kad je `productId` `null`,
 * inače update.
 *
 * Pristup se ne oslanja na `brandId`/`productId` sa klijenta bez provjere:
 * veza korisnik → brend se čita iz `brand_users`, a kod izmjene se dodatno
 * provjerava da proizvod pripada tom brendu — bez toga bi brend mogao
 * poslati tuđi `productId` i prepisati tuđi proizvod (spec 10.3).
 *
 * Validacija se ponavlja na serveru; klijentska je samo pogodnost.
 * Nikad ne baca grešku prema klijentu.
 */
export async function saveProductAction(
  brandId: string,
  productId: string | null,
  data: unknown,
  ciljniStatus: string,
): Promise<PortalProizvodRezultat> {
  try {
    const poruke = bs.portal.proizvodi.forma;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (!jeCiljniStatus(ciljniStatus)) {
      return { ok: false, error: poruke.greskaOpsta };
    }

    const [pristup] = await db
      .select({ uloga: brandUsers.uloga, status: brands.status })
      .from(brandUsers)
      .innerJoin(brands, eq(brandUsers.brandId, brands.id))
      .where(and(eq(brandUsers.userId, session.user.id), eq(brandUsers.brandId, brandId)))
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    // Suspendovan brend ne mijenja ono što stoji na platformi dok se
    // suspenzija ne riješi.
    if (pristup.status === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    let postojeciProizvod: { id: string } | null = null;

    if (productId !== null) {
      if (typeof productId !== 'string' || productId.trim() === '') {
        return { ok: false, error: poruke.greskaPristup };
      }

      const [red] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.brandId, brandId)))
        .limit(1);

      if (!red) {
        return { ok: false, error: poruke.greskaPristup };
      }

      postojeciProizvod = red;
    }

    const unos = normalizujProizvod(data);
    const greske = validirajProizvod(unos);
    const prvaGreska = Object.values(greske)[0];

    if (prvaGreska) {
      return { ok: false, error: prvaGreska };
    }

    const { kategorije, ...poljaProizvoda } = pripremiProizvod(unos);

    // NAPOMENA ZA BUDUĆNOST: ako se ukine ručno odobravanje admina,
    // 'na_cekanju' ovdje treba postati odmah 'odobren' — do tada svaki novi
    // proizvod i svaka izmjena čeka pregled (spec 10.4).
    const finalniId = await db.transaction(async (tx) => {
      let idProizvoda: string;

      if (postojeciProizvod) {
        idProizvoda = postojeciProizvod.id;

        await tx
          .update(products)
          .set({
            ...poljaProizvoda,
            status: ciljniStatus,
            // Stari razlog odbijanja više ne opisuje stanje nakon izmjene.
            razlogOdbijanja: null,
            updatedAt: new Date(),
          })
          .where(eq(products.id, idProizvoda));

        await tx.delete(productCategories).where(eq(productCategories.productId, idProizvoda));
      } else {
        const slug = await osiguraJedinstvenSlug(generisiSlug(poljaProizvoda.naziv));

        const [noviProizvod] = await tx
          .insert(products)
          .values({ ...poljaProizvoda, brandId, slug, status: ciljniStatus })
          .returning({ id: products.id });

        idProizvoda = noviProizvod!.id;
      }

      if (kategorije.length > 0) {
        await tx
          .insert(productCategories)
          .values(kategorije.map((categoryId) => ({ productId: idProizvoda, categoryId })));
      }

      return idProizvoda;
    });

    const [snimljeniProizvod] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, finalniId))
      .limit(1);

    revalidatePath('/portal/proizvodi');
    revalidatePath(`/portal/proizvodi/${finalniId}`);
    revalidatePath('/shop');
    if (snimljeniProizvod?.slug) {
      revalidatePath(`/proizvod/${snimljeniProizvod.slug}`);
    }

    return { ok: true, productId: finalniId };
  } catch {
    // Bez detalja unosa u logu.
    console.error('saveProductAction: snimanje proizvoda nije uspjelo');
    return { ok: false, error: bs.portal.proizvodi.forma.greskaOpsta };
  }
}
