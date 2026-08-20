/**
 * Ritual Blog — admin upiti (svi članci, uključujući nacrte). Javni upiti
 * (samo objavljeni) žive u `blog.ts`.
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import type { Post } from '@/lib/db/schema';

export type AdminBlogPost = {
  id: string;
  slug: string;
  naslov: string;
  status: Post['status'];
  coverUrl: string | null;
  objavljenoAt: Date | null;
  createdAt: Date;
};

/**
 * Svi članci za admin listu — nacrti uključeni. Sortirano po `createdAt`
 * (najnoviji prvo) — za razliku od javne liste (`objavljenoAt`), jer nacrt
 * nema `objavljenoAt` i ipak mora imati smislen redoslijed.
 */
export async function getAdminPosts(): Promise<AdminBlogPost[]> {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      naslov: posts.naslov,
      status: posts.status,
      coverUrl: posts.coverUrl,
      objavljenoAt: posts.objavljenoAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));
}

export type AdminBlogPostDetalj = {
  id: string;
  slug: string;
  naslov: string;
  sazetak: string | null;
  sadrzaj: string;
  coverUrl: string | null;
  autor: string | null;
  recenzentId: string | null;
  status: Post['status'];
  objavljenoAt: Date | null;
};

/** Jedan članak (bilo kog statusa) za admin formu uređivanja. */
export async function getAdminPostById(postId: string): Promise<AdminBlogPostDetalj | null> {
  const [red] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      naslov: posts.naslov,
      sazetak: posts.sazetak,
      sadrzaj: posts.sadrzaj,
      coverUrl: posts.coverUrl,
      autor: posts.autor,
      recenzentId: posts.recenzentId,
      status: posts.status,
      objavljenoAt: posts.objavljenoAt,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  return red ?? null;
}

