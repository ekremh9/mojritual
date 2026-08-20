'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { featuringPricePlans } from '@/lib/db/schema';
import type { FeaturingPricePlan } from '@/lib/db/schema';
import { kmToFening } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export type AdminFeaturingRezultat = { ok: true } | { ok: false; error: string };

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

function revalidateFeaturingPaths() {
  revalidatePath('/admin/cjenovnik');
}

function jeFeaturingTip(vrijednost: unknown): vrijednost is FeaturingPricePlan['tip'] {
  return vrijednost === 'proizvod' || vrijednost === 'brend';
}

/**
 * Dodaje novi paket isticanja. `cijenaKm` dolazi kao string s forme (isti
 * obrazac kao `product-form.ts`) i konvertuje se u fening tek nakon
 * validacije. Novi paket ide na kraj liste za svoj tip (najveći
 * `redoslijed` + 1) da admin ne mora ručno posložiti redoslijed.
 *
 * Ovo SAMO administrira cjenovnik — ne dira postojeći tok zahtjeva za
 * isticanje (`products.istaknutStatus` / `brands.istaknut`).
 */
export async function addFeaturingPlanAction(
  tip: FeaturingPricePlan['tip'],
  naziv: string,
  trajanjeDana: number,
  cijenaKm: string,
  ponavljajuce: boolean,
): Promise<AdminFeaturingRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (!jeFeaturingTip(tip)) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const poruke = bs.admin.cjenovnik.forma;

    if (typeof naziv !== 'string' || naziv.trim() === '') {
      return { ok: false, error: poruke.greskaNaziv };
    }

    if (!Number.isInteger(trajanjeDana) || trajanjeDana <= 0) {
      return { ok: false, error: poruke.greskaTrajanje };
    }

    const cijena = kmToFening(cijenaKm);
    if (!Number.isFinite(cijena) || cijena <= 0) {
      return { ok: false, error: poruke.greskaCijena };
    }

    const postojeci = await db
      .select({ redoslijed: featuringPricePlans.redoslijed })
      .from(featuringPricePlans)
      .where(eq(featuringPricePlans.tip, tip));

    const sljedeciRedoslijed =
      postojeci.reduce((max, plan) => Math.max(max, plan.redoslijed), -1) + 1;

    await db.insert(featuringPricePlans).values({
      tip,
      naziv: naziv.trim(),
      trajanjeDana,
      cijena,
      ponavljajuce: Boolean(ponavljajuce),
      redoslijed: sljedeciRedoslijed,
    });

    revalidateFeaturingPaths();

    return { ok: true };
  } catch {
    console.error('addFeaturingPlanAction: dodavanje paketa nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Ažurira paket — samo prosljeđena polja se mijenjaju (`undefined` znači
 * "ne diraj"), isti obrazac kao `updateGuideOptionAction`.
 */
export async function updateFeaturingPlanAction(
  planId: string,
  polja: {
    naziv?: string;
    trajanjeDana?: number;
    cijenaKm?: string;
    ponavljajuce?: boolean;
  },
): Promise<AdminFeaturingRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof planId !== 'string' || planId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [plan] = await db
      .select({ id: featuringPricePlans.id })
      .from(featuringPricePlans)
      .where(eq(featuringPricePlans.id, planId))
      .limit(1);

    if (!plan) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const poruke = bs.admin.cjenovnik.forma;

    const izmjene: Partial<typeof featuringPricePlans.$inferInsert> = { updatedAt: new Date() };

    if (polja.naziv !== undefined) {
      if (typeof polja.naziv !== 'string' || polja.naziv.trim() === '') {
        return { ok: false, error: poruke.greskaNaziv };
      }
      izmjene.naziv = polja.naziv.trim();
    }

    if (polja.trajanjeDana !== undefined) {
      if (!Number.isInteger(polja.trajanjeDana) || polja.trajanjeDana <= 0) {
        return { ok: false, error: poruke.greskaTrajanje };
      }
      izmjene.trajanjeDana = polja.trajanjeDana;
    }

    if (polja.cijenaKm !== undefined) {
      const cijena = kmToFening(polja.cijenaKm);
      if (!Number.isFinite(cijena) || cijena <= 0) {
        return { ok: false, error: poruke.greskaCijena };
      }
      izmjene.cijena = cijena;
    }

    if (polja.ponavljajuce !== undefined) {
      izmjene.ponavljajuce = Boolean(polja.ponavljajuce);
    }

    await db.update(featuringPricePlans).set(izmjene).where(eq(featuringPricePlans.id, planId));

    revalidateFeaturingPaths();

    return { ok: true };
  } catch {
    console.error('updateFeaturingPlanAction: ažuriranje paketa nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/**
 * Brzo uključi/isključi paket bez pune edit forme — neaktivan paket ostaje
 * u cjenovniku (istorija, ne brišemo redove) ali se ne bi nudio u
 * budućem toku zahtjeva za isticanje.
 */
export async function togglePlanActiveAction(
  planId: string,
  aktivan: boolean,
): Promise<AdminFeaturingRezultat> {
  try {
    const admin = await zahtijevajAdmina();

    if (!admin) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (typeof planId !== 'string' || planId.trim() === '') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const [plan] = await db
      .select({ id: featuringPricePlans.id })
      .from(featuringPricePlans)
      .where(eq(featuringPricePlans.id, planId))
      .limit(1);

    if (!plan) {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .update(featuringPricePlans)
      .set({ aktivan: Boolean(aktivan), updatedAt: new Date() })
      .where(eq(featuringPricePlans.id, planId));

    revalidateFeaturingPaths();

    return { ok: true };
  } catch {
    console.error('togglePlanActiveAction: promjena statusa paketa nije uspjela');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
