'use server';

import { revalidatePath } from 'next/cache';
import { and, asc, eq } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { brandUsers, brands, posts, productImages, products } from '@/lib/db/schema';
import { ALLOWED_IMAGE_TYPES, MAX_PRODUCT_IMAGES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/storage/image-constants';
import {
  processBlogCover,
  processBrandCover,
  processBrandLogo,
  processProductImage,
} from '@/lib/storage/image-processing';
import { R2_BUCKET_NAME, R2_PUBLIC_URL, obrisiSaR2, r2Client } from '@/lib/storage/r2-client';
import { bs } from '@/lib/i18n/bs';

export type UploadRezultat = { ok: true; url: string } | { ok: false; error: string };
export type BrisanjeRezultat = { ok: true } | { ok: false; error: string };

type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Utvrđuje pravi tip slike iz prvih bajtova fajla — Content-Type header
 * sa klijenta se nikad ne smije uzeti zdravo za gotovo.
 */
function detektujSlikovniTip(buffer: Buffer): AllowedImageType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

async function ucitajIProvjeriSliku(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; buffer: Buffer } | { ok: false; error: string }> {
  const poruke = bs.portal.slike;

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: poruke.greskaFajl };
  }

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: poruke.greskaTip };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { ok: false, error: poruke.greskaVelicina };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!detektujSlikovniTip(buffer)) {
    return { ok: false, error: poruke.greskaTip };
  }

  return { ok: true, buffer };
}

async function uploadNaR2(key: string, buffer: Buffer): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
    }),
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Snima logo ili naslovnu sliku brenda na R2.
 *
 * Pristup se ne oslanja na `brandId` sa klijenta bez provjere — veza
 * korisnik → brend se čita iz `brand_users`, isti obrazac kao
 * `updateBrandProfile` (spec 10.3).
 */
export async function uploadBrandImageAction(
  formData: FormData,
  tip: 'logo' | 'cover',
): Promise<UploadRezultat> {
  try {
    const poruke = bs.portal.slike;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    const brandId = formData.get('brandId');
    if (typeof brandId !== 'string' || brandId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    const [pristup] = await db
      .select({ uloga: brandUsers.uloga, status: brands.status, slug: brands.slug })
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

    const provjera = await ucitajIProvjeriSliku(formData.get('file'));
    if (!provjera.ok) {
      return provjera;
    }

    const obradjena =
      tip === 'logo' ? await processBrandLogo(provjera.buffer) : await processBrandCover(provjera.buffer);

    const key = `brands/${brandId}/${tip}-${Date.now()}.webp`;
    const url = await uploadNaR2(key, obradjena);

    await db
      .update(brands)
      .set(tip === 'logo' ? { logoUrl: url } : { coverUrl: url })
      .where(eq(brands.id, brandId));

    revalidatePath('/portal/profil');
    revalidatePath(`/partner/${pristup.slug}`);

    return { ok: true, url };
  } catch {
    // Bez detalja unosa u logu.
    console.error('uploadBrandImageAction: upload slike brenda nije uspio');
    return { ok: false, error: bs.portal.slike.greskaOpsta };
  }
}

/**
 * Dodaje sliku proizvodu (max 4 po proizvodu) i uploaduje je na R2.
 *
 * Pristup se ne oslanja na `productId` sa klijenta bez provjere — proizvod
 * mora pripadati brendu na koji je korisnik povezan (isti obrazac kao
 * `saveProductAction`, spec 10.3).
 */
export async function uploadProductImageAction(
  formData: FormData,
  productId: string,
): Promise<UploadRezultat> {
  try {
    const poruke = bs.portal.slike;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: poruke.greskaPristup };
    }

    const [pristup] = await db
      .select({ uloga: brandUsers.uloga, status: brands.status, slug: products.slug })
      .from(products)
      .innerJoin(brandUsers, eq(brandUsers.brandId, products.brandId))
      .innerJoin(brands, eq(brands.id, products.brandId))
      .where(and(eq(products.id, productId), eq(brandUsers.userId, session.user.id)))
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    // Suspendovan brend ne mijenja ono što stoji na platformi dok se
    // suspenzija ne riješi.
    if (pristup.status === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    const postojeceSlike = await db
      .select({ redoslijed: productImages.redoslijed })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.redoslijed));

    if (postojeceSlike.length >= MAX_PRODUCT_IMAGES) {
      return { ok: false, error: poruke.greskaMaxSlika };
    }

    const provjera = await ucitajIProvjeriSliku(formData.get('file'));
    if (!provjera.ok) {
      return provjera;
    }

    const obradjena = await processProductImage(provjera.buffer);
    const key = `products/${productId}/${Date.now()}.webp`;
    const url = await uploadNaR2(key, obradjena);

    const sljedeciRedoslijed =
      postojeceSlike.reduce((max, slika) => Math.max(max, slika.redoslijed), -1) + 1;

    await db.insert(productImages).values({ productId, url, redoslijed: sljedeciRedoslijed });

    revalidatePath(`/portal/proizvodi/${productId}`);
    revalidatePath('/shop');
    if (pristup.slug) {
      revalidatePath(`/proizvod/${pristup.slug}`);
    }

    return { ok: true, url };
  } catch {
    // Bez detalja unosa u logu.
    console.error('uploadProductImageAction: upload slike proizvoda nije uspio');
    return { ok: false, error: bs.portal.slike.greskaOpsta };
  }
}

/**
 * Snima naslovnu sliku (cover) bloga na R2 — admin-only, jedna slika po
 * postu (zamjenjuje se, isti obrazac kao `uploadBrandImageAction` za
 * logo/cover: stara slika ostaje na R2 kao orphan, ne briše se ovdje).
 */
export async function uploadBlogImageAction(
  formData: FormData,
  postId: string,
): Promise<UploadRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof postId !== 'string' || postId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [post] = await db
      .select({ id: posts.id, slug: posts.slug })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const provjera = await ucitajIProvjeriSliku(formData.get('file'));
    if (!provjera.ok) {
      return { ok: false, error: provjera.error };
    }

    const obradjena = await processBlogCover(provjera.buffer);
    const key = `posts/${postId}/cover-${Date.now()}.webp`;
    const url = await uploadNaR2(key, obradjena);

    await db.update(posts).set({ coverUrl: url, updatedAt: new Date() }).where(eq(posts.id, postId));

    revalidatePath('/admin/blog');
    revalidatePath(`/admin/blog/${postId}`);
    revalidatePath('/blog');
    revalidatePath(`/blog/${post.slug}`);

    return { ok: true, url };
  } catch {
    console.error('uploadBlogImageAction: upload naslovne slike bloga nije uspio');
    return { ok: false, error: bs.admin.blog.forma.slika.greskaOpsta };
  }
}

/**
 * Briše sliku proizvoda — sa R2 i iz `product_images`.
 *
 * Pristup se provjerava kroz vlasništvo proizvoda, isti obrazac kao
 * `uploadProductImageAction`.
 */
export async function deleteProductImageAction(
  imageId: string,
  productId: string,
): Promise<BrisanjeRezultat> {
  try {
    const poruke = bs.portal.slike;
    const session = await auth();

    if (!session?.user?.id) {
      return { ok: false, error: poruke.greskaPristup };
    }

    if (
      typeof imageId !== 'string' ||
      imageId.trim() === '' ||
      typeof productId !== 'string' ||
      productId.trim() === ''
    ) {
      return { ok: false, error: poruke.greskaPristup };
    }

    const [pristup] = await db
      .select({
        uloga: brandUsers.uloga,
        status: brands.status,
        slug: products.slug,
        url: productImages.url,
      })
      .from(productImages)
      .innerJoin(products, eq(products.id, productImages.productId))
      .innerJoin(brandUsers, eq(brandUsers.brandId, products.brandId))
      .innerJoin(brands, eq(brands.id, products.brandId))
      .where(
        and(
          eq(productImages.id, imageId),
          eq(productImages.productId, productId),
          eq(brandUsers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!pristup || (pristup.uloga !== 'vlasnik' && pristup.uloga !== 'urednik')) {
      return { ok: false, error: poruke.greskaPristup };
    }

    // Suspendovan brend ne mijenja ono što stoji na platformi dok se
    // suspenzija ne riješi.
    if (pristup.status === 'suspendovan') {
      return { ok: false, error: poruke.greskaSuspendovan };
    }

    await obrisiSaR2(pristup.url);

    await db.delete(productImages).where(eq(productImages.id, imageId));

    revalidatePath(`/portal/proizvodi/${productId}`);
    revalidatePath('/shop');
    if (pristup.slug) {
      revalidatePath(`/proizvod/${pristup.slug}`);
    }

    return { ok: true };
  } catch {
    // Bez detalja unosa u logu.
    console.error('deleteProductImageAction: brisanje slike proizvoda nije uspjelo');
    return { ok: false, error: bs.portal.slike.greskaOpsta };
  }
}
