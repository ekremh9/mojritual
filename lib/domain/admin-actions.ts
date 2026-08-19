'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brandUsers, brands, products } from '@/lib/db/schema';
import { createNotification } from '@/lib/domain/notifications';
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
 * Svi vlasnici brenda (uloga='vlasnik') — ne samo prvi. Obavještenje poput
 * "vaš proizvod je odobren" treba stići svakom ko stvarno ima vlasništvo
 * nad brendom, ne proizvoljno izabranom jednom čovjeku (spec 10.2: jedan
 * brend može imati više ljudi). Greška se guta, vraća praznu listu —
 * traženje primaoca obavještenja ne smije oboriti glavnu admin akciju,
 * isto pravilo kao `createNotification` samo.
 */
export async function getBrandVlasniciIds(brandId: string): Promise<string[]> {
  try {
    const vlasnici = await db
      .select({ userId: brandUsers.userId })
      .from(brandUsers)
      .where(and(eq(brandUsers.brandId, brandId), eq(brandUsers.uloga, 'vlasnik')));

    return vlasnici.map((vlasnik) => vlasnik.userId);
  } catch {
    console.error('getBrandVlasniciIds: dohvat vlasnika brenda nije uspio');
    return [];
  }
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
      .select({
        status: products.status,
        slug: products.slug,
        naziv: products.naziv,
        brandId: products.brandId,
      })
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

    const vlasniciIds = await getBrandVlasniciIds(proizvod.brandId);
    await Promise.all(
      vlasniciIds.map((userId) =>
        createNotification(
          userId,
          'proizvod_odobren',
          bs.notifikacije.proizvodOdobren.naslov,
          bs.notifikacije.proizvodOdobren.sadrzaj(proizvod.naziv),
          `/portal/proizvodi/${productId}`,
        ),
      ),
    );

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
      .select({ status: products.status, naziv: products.naziv, brandId: products.brandId })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (proizvod.status !== 'na_cekanju') {
      return { ok: false, error: bs.admin.greskaVecObradjeno };
    }

    const razlogOcisceno = razlog.trim();

    await db
      .update(products)
      .set({
        status: 'odbijen',
        razlogOdbijanja: razlogOcisceno,
        odobrioUserId: admin.id,
        odobrenoAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath('/admin/proizvodi');
    revalidatePath(`/admin/proizvodi/${productId}`);

    const vlasniciIds = await getBrandVlasniciIds(proizvod.brandId);
    await Promise.all(
      vlasniciIds.map((userId) =>
        createNotification(
          userId,
          'proizvod_odbijen',
          bs.notifikacije.proizvodOdbijen.naslov,
          bs.notifikacije.proizvodOdbijen.sadrzaj(proizvod.naziv, razlogOcisceno),
          `/portal/proizvodi/${productId}`,
        ),
      ),
    );

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
    revalidatePath(`/partner/${brend.slug}`);

    const vlasniciIds = await getBrandVlasniciIds(brandId);
    await Promise.all(
      vlasniciIds.map((userId) =>
        createNotification(
          userId,
          'brend_odobren',
          bs.notifikacije.brendOdobren.naslov,
          bs.notifikacije.brendOdobren.sadrzaj,
          '/portal',
        ),
      ),
    );

    return { ok: true };
  } catch {
    console.error('approveBrandAction: odobravanje brenda nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Odobrava isticanje proizvoda na početnoj — `products.istaknutStatus`,
 * odvojeno od `products.status` (odobrenje proizvoda samog). Admin može
 * odobriti proizvod ali odbiti isticanje, ili obrnuto. Radi bez obzira na
 * status odobrenja proizvoda — homepage/katalog ionako filtriraju na
 * `status = 'odobren'`, pa isticanje neodobrenog proizvoda nema efekta dok
 * ne bude odobren.
 */
export async function approveFeaturedAction(productId: string): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [proizvod] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .update(products)
      .set({ istaknutStatus: 'odobreno', istaknutRazlogOdbijanja: null, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath('/admin/proizvodi');
    revalidatePath(`/admin/proizvodi/${productId}`);
    revalidatePath('/');

    return { ok: true };
  } catch {
    console.error('approveFeaturedAction: odobravanje isticanja nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Odbija isticanje proizvoda uz obavezan razlog — isti obrazac kao
 * `rejectProductAction`. Koristi se i za odbijanje novog zahtjeva i za
 * povlačenje već odobrenog isticanja (nema posebne "ukloni" akcije).
 */
export async function rejectFeaturedAction(
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
      return { ok: false, error: bs.admin.proizvodi.detalj.isticanje.greskaRazlog };
    }

    const [proizvod] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .update(products)
      .set({
        istaknutStatus: 'odbijeno',
        istaknutRazlogOdbijanja: razlog.trim(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    revalidatePath('/admin/proizvodi');
    revalidatePath(`/admin/proizvodi/${productId}`);
    revalidatePath('/');

    return { ok: true };
  } catch {
    console.error('rejectFeaturedAction: odbijanje isticanja nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Ručno postavlja `brands.istaknut` — jednostavan boolean toggle, za razliku
 * od `approveFeaturedAction`/`rejectFeaturedAction` za proizvode (koji imaju
 * tok odobravanja sa razlogom odbijanja): brend ovdje ne šalje namjeru,
 * admin direktno uključuje/isključuje isticanje partnera na početnoj.
 */
export async function toggleBrandFeaturedAction(
  brandId: string,
  novoStanje: boolean,
): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [brend] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brend) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db.update(brands).set({ istaknut: novoStanje }).where(eq(brands.id, brandId));

    revalidatePath('/admin/brendovi');
    revalidatePath(`/admin/brendovi/${brandId}`);
    revalidatePath('/');

    return { ok: true };
  } catch {
    console.error('toggleBrandFeaturedAction: promjena isticanja nije uspjela');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Ručno postavlja `brands.verifikovan` — odvojeno od `brands.status`
 * (odobrenje brenda samog). Radi bez obzira na status brenda; javna
 * stranica partnera ionako prikazuje značku samo kad je brend odobren
 * (vidi UI u app/admin/brendovi/[id]/page.tsx).
 */
export async function toggleVerifiedAction(
  brandId: string,
  novoStanje: boolean,
): Promise<AdminRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [brend] = await db
      .select({ id: brands.id, slug: brands.slug })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    if (!brend) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db.update(brands).set({ verifikovan: novoStanje }).where(eq(brands.id, brandId));

    revalidatePath('/admin/brendovi');
    revalidatePath(`/admin/brendovi/${brandId}`);
    revalidatePath(`/partner/${brend.slug}`);
    revalidatePath('/partneri');

    return { ok: true };
  } catch {
    console.error('toggleVerifiedAction: promjena verifikacije nije uspjela');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
