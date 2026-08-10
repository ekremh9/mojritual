'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brands, products } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export type AdminRezultat = { ok: true } | { ok: false; error: string };

/**
 * Provjerava da je pozivalac prijavljen admin. Uloga se čita iz sesije, ne
 * sa klijenta — svaka akcija u ovom fajlu ponavlja ovu provjeru, jer se
 * proxy i layout ne smiju smatrati jedinom granicom pristupa.
 */
async function zahtijevajAdmina(): Promise<{ id: string } | null> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return null;
  }

  return { id: session.user.id };
}

/**
 * Odobrava proizvod na čekanju — postaje javno vidljiv.
 * Ne mijenja proizvode koji nisu (više) na čekanju, da dva admina koja
 * rade istovremeno ne prepišu jedan drugog.
 */
export async function approveProductAction(productId: string): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [proizvod] = await db
      .select({ status: products.status, slug: products.slug })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (proizvod.status !== 'na_cekanju') {
      return { ok: false, error: bs.admin.greskaVecObradjeno };
    }

    await db
      .update(products)
      .set({
        status: 'odobren',
        razlogOdbijanja: null,
        odobrioUserId: admin.id,
        odobrenoAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath('/admin/proizvodi');
    revalidatePath(`/admin/proizvodi/${productId}`);
    revalidatePath('/shop');
    revalidatePath(`/proizvod/${proizvod.slug}`);

    return { ok: true };
  } catch {
    console.error('approveProductAction: odobravanje proizvoda nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Odbija proizvod na čekanju uz obavezan razlog — brend ga vidi i može
 * poslati ispravku (spec 10.4).
 */
export async function rejectProductAction(
  productId: string,
  razlog: string,
): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof razlog !== 'string' || razlog.trim().length < 10) {
      return { ok: false, error: bs.admin.proizvodi.detalj.odbijanje.greskaRazlog };
    }

    const [proizvod] = await db
      .select({ status: products.status })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (proizvod.status !== 'na_cekanju') {
      return { ok: false, error: bs.admin.greskaVecObradjeno };
    }

    await db
      .update(products)
      .set({
        status: 'odbijen',
        razlogOdbijanja: razlog.trim(),
        odobrioUserId: admin.id,
        odobrenoAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath('/admin/proizvodi');
    revalidatePath(`/admin/proizvodi/${productId}`);

    return { ok: true };
  } catch {
    console.error('rejectProductAction: odbijanje proizvoda nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Odobrava brend na čekanju — dobija pristup portalu i javnu stranicu.
 *
 * NAPOMENA: `brands.status` trenutno ima samo na_cekanju/odobren/suspendovan
 * (docs/schema.md sekcija 2) — nema vrijednosti za "odbijen". Dok se šema ne
 * proširi, ova iteracija namjerno ne nudi odbijanje brenda (vidi UI u
 * app/admin/brendovi/[id]/page.tsx), da se 'suspendovan' pogrešno ne
 * upotrijebi za nešto što znači nešto drugo (kažnjavanje aktivnog brenda).
 */
export async function approveBrandAction(brandId: string): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [brend] = await db
      .select({ status: brands.status, slug: brands.slug })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brend) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (brend.status !== 'na_cekanju') {
      return { ok: false, error: bs.admin.greskaVecObradjeno };
    }

    await db.update(brands).set({ status: 'odobren' }).where(eq(brands.id, brandId));

    revalidatePath('/admin/brendovi');
    revalidatePath(`/admin/brendovi/${brandId}`);
    revalidatePath(`/brend/${brend.slug}`);

    return { ok: true };
  } catch {
    console.error('approveBrandAction: odobravanje brenda nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
