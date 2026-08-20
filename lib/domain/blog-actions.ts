'use server';

import { revalidatePath } from 'next/cache';
import { eq, like, or } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { medicalReviewers, posts } from '@/lib/db/schema';
import type { Post } from '@/lib/db/schema';
import { generisiSlug } from '@/lib/domain/slug';
import { obrisiSaR2 } from '@/lib/storage/r2-client';
import { bs } from '@/lib/i18n/bs';

export type AdminBlogRezultat = { ok: true } | { ok: false; error: string };
export type AdminBlogSaveRezultat = { ok: true; postId: string } | { ok: false; error: string };

/**
 * Provjerava da je pozivalac prijavljen admin. Uloga se čita iz sesije, ne
 * sa klijenta — svaka akcija u ovom fajlu ponavlja ovu provjeru.
 *
 * NAPOMENA (poznato ograničenje, namjerno za ovaj zadatak): pisanje bloga
 * je ograničeno na admin rolu. `medical_reviewers` NIJE povezan sa `users`/
 * auth sistemom (nema `user_id` kolone, nema login-a za recenzenta) — to
 * je zaseban rječnik imena/titula koji se samo LINKUJE na post preko
 * `posts.recenzent_id`, prikazan javno kao "autor/recenzent". Posebna rola
 * za medicinske recenzente van admina je buduća stavka, ne implementirana
 * ovdje (vidi self-review).
 */
async function zahtijevajAdmina(): Promise<{ id: string } | null> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return null;
  }

  return { id: session.user.id };
}

function revalidateBlogPaths(slug?: string) {
  revalidatePath('/admin/blog');
  revalidatePath('/blog');
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

/** Dodaje broj kad se osnovni slug poklapa sa postojećim (`naslov`, `naslov-2`, ...) — isti obrazac kao proizvodi (portal-product-actions.ts). */
async function osiguraJedinstvenSlug(baza: string): Promise<string> {
  const postojeci = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(or(eq(posts.slug, baza), like(posts.slug, `${baza}-%`)));

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

type ClanakUnos = {
  naslov: string;
  slug: string;
  sazetak: string;
  sadrzaj: string;
  autor: string;
  recenzentId: string;
  status: string;
};

function normalizujClanak(data: unknown): ClanakUnos {
  const izvor = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
  const tekst = (vrijednost: unknown) => (typeof vrijednost === 'string' ? vrijednost.trim() : '');

  return {
    naslov: tekst(izvor.naslov),
    slug: tekst(izvor.slug),
    sazetak: tekst(izvor.sazetak),
    sadrzaj: tekst(izvor.sadrzaj),
    autor: tekst(izvor.autor),
    recenzentId: tekst(izvor.recenzentId),
    status: tekst(izvor.status),
  };
}

/**
 * Kreira ili ažurira članak. Slug se izvodi i zaključava SAMO pri kreiranju
 * (`postId === null`) — isti princip kao proizvodi: nakon toga slug je
 * stabilan javni URL, dalje izmjene naslova ga ne mijenjaju.
 *
 * `objavljenoAt` se postavlja samo jednom, prvi put kad status postane
 * `objavljeno` (dok je bio `null`) — kasnije izmjene sadržaja ne pomjeraju
 * datum objave. Vraćanje na nacrt ne briše taj datum (istorijski trag).
 */
export async function saveBlogPostAction(
  postId: string | null,
  data: unknown,
): Promise<AdminBlogSaveRezultat> {
  try {
    const poruke = bs.admin.blog.forma;
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const unos = normalizujClanak(data);

    if (unos.naslov === '') {
      return { ok: false, error: poruke.greskaNaslov };
    }

    if (unos.sadrzaj === '') {
      return { ok: false, error: poruke.greskaSadrzaj };
    }

    if (unos.status !== 'nacrt' && unos.status !== 'objavljeno') {
      return { ok: false, error: poruke.greskaStatus };
    }
    // `unos.status` je deklarisan kao `string` (izlaz iz normalizujClanak) —
    // provjera iznad garantuje da je jedna od dvije validne vrijednosti, ali
    // TS ne suzi plain `string` preko `!==` poređenja, pa je cast ovdje
    // siguran (potvrđeno runtime provjerom, ne pretpostavka).
    const status = unos.status as Post['status'];

    let recenzentId: string | null = null;
    if (unos.recenzentId !== '') {
      const [recenzent] = await db
        .select({ id: medicalReviewers.id })
        .from(medicalReviewers)
        .where(eq(medicalReviewers.id, unos.recenzentId))
        .limit(1);

      if (!recenzent) {
        return { ok: false, error: poruke.greskaRecenzent };
      }

      recenzentId = recenzent.id;
    }

    const zajednickaPolja = {
      naslov: unos.naslov,
      sazetak: unos.sazetak === '' ? null : unos.sazetak,
      sadrzaj: unos.sadrzaj,
      autor: unos.autor === '' ? null : unos.autor,
      recenzentId,
      status,
    };

    if (postId === null) {
      const slugBaza = generisiSlug(unos.slug !== '' ? unos.slug : unos.naslov);
      const slug = await osiguraJedinstvenSlug(slugBaza !== '' ? slugBaza : 'clanak');

      const [noviPost] = await db
        .insert(posts)
        .values({
          ...zajednickaPolja,
          slug,
          objavljenoAt: status === 'objavljeno' ? new Date() : null,
        })
        .returning({ id: posts.id });

      revalidateBlogPaths(slug);

      return { ok: true, postId: noviPost!.id };
    }

    const [postojeci] = await db
      .select({ id: posts.id, slug: posts.slug, objavljenoAt: posts.objavljenoAt })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postojeci) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .update(posts)
      .set({
        ...zajednickaPolja,
        objavljenoAt:
          status === 'objavljeno' && postojeci.objavljenoAt === null
            ? new Date()
            : postojeci.objavljenoAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    revalidateBlogPaths(postojeci.slug);
    revalidatePath(`/admin/blog/${postId}`);

    return { ok: true, postId };
  } catch {
    console.error('saveBlogPostAction: snimanje članka nije uspjelo');
    return { ok: false, error: bs.admin.blog.forma.greskaOpsta };
  }
}

/** Briše članak trajno — sa R2 (naslovna slika) i iz baze. Blog nema zavisnih tabela (nema narudžbi/recenzija vezanih za post). */
export async function deleteBlogPostAction(postId: string): Promise<AdminBlogRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof postId !== 'string' || postId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [post] = await db
      .select({ coverUrl: posts.coverUrl })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (post.coverUrl) {
      await obrisiSaR2(post.coverUrl);
    }

    await db.delete(posts).where(eq(posts.id, postId));

    revalidateBlogPaths();

    return { ok: true };
  } catch {
    console.error('deleteBlogPostAction: brisanje članka nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
