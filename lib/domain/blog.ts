/**
 * Ritual Blog — javni upiti (samo objavljeni članci). Admin CRUD i upiti
 * koji uključuju nacrte žive u `admin-blog.ts`.
 */
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { medicalReviewers, posts } from '@/lib/db/schema';

export type BlogPostKartica = {
  id: string;
  slug: string;
  naslov: string;
  sazetak: string | null;
  coverUrl: string | null;
  objavljenoAt: Date | null;
  autorPrikaz: string | null;
};

export type BlogPostDetalj = BlogPostKartica & {
  sadrzaj: string;
};

/**
 * Prikaz autora na kartici/detalju — `autor` (slobodan tekst koji je admin
 * unio) ima prednost, jer je specifičniji ("Dr. Amina Ćurić za redakciju
 * Ritual"); `recenzent.ime` je fallback kad `autor` nije popunjen ali je
 * post povezan sa medicinskim recenzentom.
 */
function autorPrikaz(autor: string | null, recenzentIme: string | null): string | null {
  return autor && autor.trim() !== '' ? autor : recenzentIme;
}

/** Svi objavljeni članci, najnoviji prvo. */
export async function getPublishedPosts(): Promise<BlogPostKartica[]> {
  const redovi = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      naslov: posts.naslov,
      sazetak: posts.sazetak,
      coverUrl: posts.coverUrl,
      objavljenoAt: posts.objavljenoAt,
      autor: posts.autor,
      recenzentIme: medicalReviewers.ime,
    })
    .from(posts)
    .leftJoin(medicalReviewers, eq(posts.recenzentId, medicalReviewers.id))
    .where(eq(posts.status, 'objavljeno'))
    .orderBy(desc(posts.objavljenoAt));

  return redovi.map((red) => ({
    id: red.id,
    slug: red.slug,
    naslov: red.naslov,
    sazetak: red.sazetak,
    coverUrl: red.coverUrl,
    objavljenoAt: red.objavljenoAt,
    autorPrikaz: autorPrikaz(red.autor, red.recenzentIme),
  }));
}

/** Jedan objavljen članak po slug-u — `null` i za nepostojeći i za neobjavljen (isti tretman, nema otkrivanja nacrta). */
export async function getPublishedPostBySlug(slug: string): Promise<BlogPostDetalj | null> {
  const [red] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      naslov: posts.naslov,
      sazetak: posts.sazetak,
      sadrzaj: posts.sadrzaj,
      coverUrl: posts.coverUrl,
      objavljenoAt: posts.objavljenoAt,
      autor: posts.autor,
      recenzentIme: medicalReviewers.ime,
    })
    .from(posts)
    .leftJoin(medicalReviewers, eq(posts.recenzentId, medicalReviewers.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, 'objavljeno')))
    .limit(1);

  if (!red) {
    return null;
  }

  return {
    id: red.id,
    slug: red.slug,
    naslov: red.naslov,
    sazetak: red.sazetak,
    sadrzaj: red.sadrzaj,
    coverUrl: red.coverUrl,
    objavljenoAt: red.objavljenoAt,
    autorPrikaz: autorPrikaz(red.autor, red.recenzentIme),
  };
}

export type MedicalReviewerOpcija = { id: string; ime: string };

/** Aktivni medicinski recenzenti — za admin formu (select uz "autor" tekst polje). */
export async function getActiveMedicalReviewers(): Promise<MedicalReviewerOpcija[]> {
  const redovi = await db
    .select({ id: medicalReviewers.id, ime: medicalReviewers.ime })
    .from(medicalReviewers)
    .where(eq(medicalReviewers.aktivan, true));

  return redovi;
}
