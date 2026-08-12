'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { goals, guideExplanationTemplates, productGoals, products } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export type AdminGuideRezultat = { ok: true } | { ok: false; error: string };

/**
 * Provjerava da je pozivalac prijavljen admin. Uloga se čita iz sesije, ne
 * sa klijenta — svaka akcija u ovom fajlu ponavlja ovu provjeru.
 */
async function zahtijevajAdmina(): Promise<{ id: string } | null> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'admin') {
    return null;
  }

  return { id: session.user.id };
}

function revalidateGuidePaths(goalId: string) {
  revalidatePath('/admin/vodic');
  revalidatePath(`/admin/vodic/${goalId}`);
}

/**
 * Snima tekst objašnjenja za cilj — ažurira postojeći aktivan tekst ako
 * postoji, inače kreira novi. Za sada postoji samo jedan aktivan tekst po
 * cilju (vidi napomenu uz `guide_explanation_templates` u šemi).
 */
export async function saveExplanationTemplateAction(
  goalId: string,
  tekst: string,
): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof goalId !== 'string' || goalId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof tekst !== 'string' || tekst.trim() === '') {
      return { ok: false, error: bs.admin.vodic.detalj.tekst.greskaPrazanTekst };
    }

    const [cilj] = await db.select({ id: goals.id }).from(goals).where(eq(goals.id, goalId)).limit(1);

    if (!cilj) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const trimovanTekst = tekst.trim();

    const [postojeci] = await db
      .select({ id: guideExplanationTemplates.id })
      .from(guideExplanationTemplates)
      .where(
        and(eq(guideExplanationTemplates.goalId, goalId), eq(guideExplanationTemplates.aktivan, true)),
      )
      .limit(1);

    if (postojeci) {
      await db
        .update(guideExplanationTemplates)
        .set({ tekst: trimovanTekst, updatedAt: new Date() })
        .where(eq(guideExplanationTemplates.id, postojeci.id));
    } else {
      await db.insert(guideExplanationTemplates).values({
        goalId,
        tekst: trimovanTekst,
        aktivan: true,
      });
    }

    revalidateGuidePaths(goalId);

    return { ok: true };
  } catch {
    console.error('saveExplanationTemplateAction: snimanje teksta objašnjenja nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Postavlja (ili ažurira) vezu proizvod–cilj sa relevantnošću i oznakom.
 * Relevantnost i oznaka se NIKAD ne postavljaju automatski — samo kroz
 * eksplicitnu akciju admina/recenzenta (CLAUDE.md pravilo 2).
 */
export async function setProductGoalAction(
  productId: string,
  goalId: string,
  relevantnost: number,
  oznaka: 'primarni' | 'sekundarni',
): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof goalId !== 'string' || goalId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (!Number.isInteger(relevantnost) || relevantnost < 1 || relevantnost > 100) {
      return { ok: false, error: bs.admin.vodic.detalj.proizvodi.greskaRelevantnost };
    }

    if (oznaka !== 'primarni' && oznaka !== 'sekundarni') {
      return { ok: false, error: bs.admin.greskaOpsta };
    }

    const [cilj] = await db.select({ id: goals.id }).from(goals).where(eq(goals.id, goalId)).limit(1);

    if (!cilj) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [proizvod] = await db
      .select({ status: products.status })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!proizvod || proizvod.status !== 'odobren') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .insert(productGoals)
      .values({ productId, goalId, relevantnost, oznaka })
      .onConflictDoUpdate({
        target: [productGoals.productId, productGoals.goalId],
        set: { relevantnost, oznaka },
      });

    revalidateGuidePaths(goalId);

    return { ok: true };
  } catch {
    console.error('setProductGoalAction: povezivanje proizvoda sa ciljem nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/** Uklanja vezu proizvod–cilj. */
export async function removeProductGoalAction(
  productId: string,
  goalId: string,
): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof productId !== 'string' || productId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof goalId !== 'string' || goalId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .delete(productGoals)
      .where(and(eq(productGoals.productId, productId), eq(productGoals.goalId, goalId)));

    revalidateGuidePaths(goalId);

    return { ok: true };
  } catch {
    console.error('removeProductGoalAction: uklanjanje veze proizvod-cilj nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
