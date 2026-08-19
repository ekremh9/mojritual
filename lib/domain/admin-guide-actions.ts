'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  goals,
  guideExplanationTemplates,
  guideOptionTemplates,
  productGoalProposals,
  productGoals,
  products,
} from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

export type AdminGuideRezultat = { ok: true } | { ok: false; error: string };

const MAX_OPCIJA_PO_CILJU = 5;

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
 *
 * Ako je partner prethodno predložio isti (productId, goalId) par
 * (`product_goal_proposals`), taj prijedlog se ovdje označava kao obrađen
 * (`obradjenoAt`), NE briše — trajan trag da je partner nešto predlagao i
 * da je recenzent donio odluku, umjesto da prijedlog nestane bez traga.
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

    // Recenzent je upravo postavio stvarnu vezu za ovaj (productId, goalId)
    // par — partnerov prijedlog (ako postoji i ako već nije obrađen) se
    // označava kao obrađen. Red OSTAJE (trajan trag), samo prelazi iz
    // "Novi prijedlog" u tiši, informativni signal (vidi ProductGoalRow.tsx).
    await db
      .update(productGoalProposals)
      .set({ obradjenoAt: new Date() })
      .where(
        and(
          eq(productGoalProposals.productId, productId),
          eq(productGoalProposals.goalId, goalId),
          isNull(productGoalProposals.obradjenoAt),
        ),
      );

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

/**
 * Dodaje opciju za dodatno pitanje (korak 3 Vodiča) za dati cilj. Najviše
 * `MAX_OPCIJA_PO_CILJU` AKTIVNIH opcija po cilju — provjera se radi ovdje,
 * na serveru, ne oslanja se na onemogućeno dugme na klijentu (koje bi se
 * moglo zaobići direktnim pozivom akcije).
 */
export async function addGuideOptionAction(
  goalId: string,
  tekstOpcije: string,
  tekstObjasnjenja?: string,
): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof goalId !== 'string' || goalId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof tekstOpcije !== 'string' || tekstOpcije.trim() === '') {
      return { ok: false, error: bs.admin.vodic.detalj.opcije.greskaTekstOpcije };
    }

    const [cilj] = await db.select({ id: goals.id }).from(goals).where(eq(goals.id, goalId)).limit(1);

    if (!cilj) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const aktivneOpcije = await db
      .select({ redoslijed: guideOptionTemplates.redoslijed })
      .from(guideOptionTemplates)
      .where(and(eq(guideOptionTemplates.goalId, goalId), eq(guideOptionTemplates.aktivan, true)));

    if (aktivneOpcije.length >= MAX_OPCIJA_PO_CILJU) {
      return { ok: false, error: bs.admin.vodic.detalj.opcije.greskaMaksimum };
    }

    const sljedeciRedoslijed =
      aktivneOpcije.reduce((max, opcija) => Math.max(max, opcija.redoslijed), -1) + 1;

    const tekstObjasnjenjaOcisceno =
      typeof tekstObjasnjenja === 'string' && tekstObjasnjenja.trim() !== ''
        ? tekstObjasnjenja.trim()
        : null;

    await db.insert(guideOptionTemplates).values({
      goalId,
      tekstOpcije: tekstOpcije.trim(),
      tekstObjasnjenja: tekstObjasnjenjaOcisceno,
      redoslijed: sljedeciRedoslijed,
      aktivan: true,
    });

    revalidateGuidePaths(goalId);

    return { ok: true };
  } catch {
    console.error('addGuideOptionAction: dodavanje opcije nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Ažurira tekst opcije i/ili njeno objašnjenje. Samo prosljeđena polja se
 * mijenjaju — `undefined` znači "ne diraj", prazan string za objašnjenje
 * znači "obriši objašnjenje" (postavlja se na `null`).
 */
export async function updateGuideOptionAction(
  optionId: string,
  tekstOpcije?: string,
  tekstObjasnjenja?: string,
): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof optionId !== 'string' || optionId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [opcija] = await db
      .select({ id: guideOptionTemplates.id, goalId: guideOptionTemplates.goalId })
      .from(guideOptionTemplates)
      .where(eq(guideOptionTemplates.id, optionId))
      .limit(1);

    if (!opcija) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const izmjene: { tekstOpcije?: string; tekstObjasnjenja?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (tekstOpcije !== undefined) {
      if (typeof tekstOpcije !== 'string' || tekstOpcije.trim() === '') {
        return { ok: false, error: bs.admin.vodic.detalj.opcije.greskaTekstOpcije };
      }
      izmjene.tekstOpcije = tekstOpcije.trim();
    }

    if (tekstObjasnjenja !== undefined) {
      izmjene.tekstObjasnjenja =
        typeof tekstObjasnjenja === 'string' && tekstObjasnjenja.trim() !== ''
          ? tekstObjasnjenja.trim()
          : null;
    }

    await db.update(guideOptionTemplates).set(izmjene).where(eq(guideOptionTemplates.id, optionId));

    revalidateGuidePaths(opcija.goalId);

    return { ok: true };
  } catch {
    console.error('updateGuideOptionAction: ažuriranje opcije nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Uklanja opciju — SOFT-DELETE (`aktivan = false`), ne DELETE reda.
 *
 * `guide_sessions.odgovori` bilježi odabranu opciju po TEKSTU, ne po
 * `optionId` (nema FK) — hard delete tehnički ne bi pokidao historijske
 * sesije. Soft-delete je ipak izabran jer: (1) je reverzibilan, isti princip
 * kao `unpublishProductAction` (proizvod se povlači, ne briše) — administratorska
 * greška se da ispraviti bez pristupa bazi; (2) "manje od 5 AKTIVNIH opcija"
 * provjera u `addGuideOptionAction` već tretira `aktivan` kao operativni
 * signal vidljivosti, isti obrazac kao `guideExplanationTemplates.aktivan`.
 */
export async function removeGuideOptionAction(optionId: string): Promise<AdminGuideRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof optionId !== 'string' || optionId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [opcija] = await db
      .select({ id: guideOptionTemplates.id, goalId: guideOptionTemplates.goalId })
      .from(guideOptionTemplates)
      .where(eq(guideOptionTemplates.id, optionId))
      .limit(1);

    if (!opcija) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .update(guideOptionTemplates)
      .set({ aktivan: false, updatedAt: new Date() })
      .where(eq(guideOptionTemplates.id, optionId));

    revalidateGuidePaths(opcija.goalId);

    return { ok: true };
  } catch {
    console.error('removeGuideOptionAction: uklanjanje opcije nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
