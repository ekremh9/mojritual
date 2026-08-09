'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brandUsers, brands } from '@/lib/db/schema';
import {
  normalizujBrandProfil,
  pripremiBrandProfil,
  validirajBrandProfil,
  type BrandProfilUnos,
} from '@/lib/domain/brand-profile';
import { bs } from '@/lib/i18n/bs';

export type PortalRezultat = { ok: true } | { ok: false; error: string };

/**
 * Snima profil brenda iz portala.
 *
 * Pristup se ne oslanja na `brandId` koji je stigao sa klijenta — veza
 * korisnik → brend se ponovo čita iz `brand_users`. Bez toga bi brend mogao
 * poslati tuđi `brandId` i prepisati tuđi profil (spec 10.3).
 *
 * Validacija se ponavlja na serveru; klijentska je samo pogodnost.
 * Nikad ne baca grešku prema klijentu.
 */
export async function updateBrandProfile(
  brandId: string,
  data: BrandProfilUnos,
): Promise<PortalRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: bs.portal.profil.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: bs.portal.profil.greskaPristup };
    }

    const [pristup] = await db
      .select({
        uloga: brandUsers.uloga,
        status: brands.status,
        slug: brands.slug,
      })
      .from(brandUsers)
      .innerJoin(brands, eq(brandUsers.brandId, brands.id))
      .where(and(eq(brandUsers.userId, session.user.id), eq(brandUsers.brandId, brandId)))
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: bs.portal.profil.greskaPristup };
    }

    // Suspendovan brend ne mijenja ono što stoji na platformi dok se
    // suspenzija ne riješi.
    if (pristup.status === 'suspendovan') {
      return { ok: false, error: bs.portal.profil.greskaSuspendovan };
    }

    const unos = normalizujBrandProfil(data);
    const greske = validirajBrandProfil(unos);
    const prvaGreska = Object.values(greske)[0];

    if (prvaGreska) {
      return { ok: false, error: prvaGreska };
    }

    await db.update(brands).set(pripremiBrandProfil(unos)).where(eq(brands.id, brandId));

    revalidatePath('/portal/profil');
    revalidatePath(`/brend/${pristup.slug}`);

    return { ok: true };
  } catch {
    // Bez detalja unosa u logu.
    console.error('updateBrandProfile: snimanje profila brenda nije uspjelo');
    return { ok: false, error: bs.portal.profil.greskaOpsta };
  }
}
