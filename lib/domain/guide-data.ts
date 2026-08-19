/**
 * Server-side dohvat podataka za korak 2 i korak 3 Ritual Vodiča (ciljevi i
 * njihove opcije za dodatno pitanje). Poziva se iz server komponente
 * `/vodic`, ne treba `'use server'`.
 */
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { goals, guideOptionTemplates } from '@/lib/db/schema';
import { GUIDE_GOAL_SLUG_REDOSLIJED } from './guide-questions';

export type GuideCilj = {
  id: string;
  slug: string;
  naziv: string;
};

export type GuideOpcija = {
  id: string;
  tekstOpcije: string;
  tekstObjasnjenja: string | null;
};

/** Svih 7 ciljeva, u redoslijedu čitljivom korisniku (vidi guide-questions.ts). */
export async function getGoalsForVodic(): Promise<GuideCilj[]> {
  const sviCiljevi = await db
    .select({ id: goals.id, slug: goals.slug, naziv: goals.naziv })
    .from(goals);

  const indeksRedoslijeda = new Map<string, number>(
    GUIDE_GOAL_SLUG_REDOSLIJED.map((slug, indeks) => [slug, indeks]),
  );

  return sviCiljevi
    .slice()
    .sort(
      (a, b) =>
        (indeksRedoslijeda.get(a.slug) ?? GUIDE_GOAL_SLUG_REDOSLIJED.length) -
        (indeksRedoslijeda.get(b.slug) ?? GUIDE_GOAL_SLUG_REDOSLIJED.length),
    );
}

/**
 * Aktivne opcije za dodatno pitanje (korak 3), grupisane po cilju i
 * sortirane po redoslijed. Dohvata se za sve ciljeve unaprijed (korisnik tek
 * u koraku 2 bira koji ga se tiču) — jedan upit je jednostavnije od lijenog
 * dohvata po odabiru, a skup opcija je mali.
 *
 * Cilj bez ijedne aktivne opcije jednostavno nema ključ u rezultatu — Korak3
 * to tretira kao "nema dodatnog pitanja za ovaj cilj" i preskače ga.
 */
export async function getGuideOptionsByGoal(): Promise<Record<string, GuideOpcija[]>> {
  const opcije = await db
    .select({
      goalId: guideOptionTemplates.goalId,
      id: guideOptionTemplates.id,
      tekstOpcije: guideOptionTemplates.tekstOpcije,
      tekstObjasnjenja: guideOptionTemplates.tekstObjasnjenja,
    })
    .from(guideOptionTemplates)
    .where(eq(guideOptionTemplates.aktivan, true))
    .orderBy(asc(guideOptionTemplates.redoslijed));

  const opcijePoCilju: Record<string, GuideOpcija[]> = {};
  for (const opcija of opcije) {
    (opcijePoCilju[opcija.goalId] ??= []).push({
      id: opcija.id,
      tekstOpcije: opcija.tekstOpcije,
      tekstObjasnjenja: opcija.tekstObjasnjenja,
    });
  }

  return opcijePoCilju;
}
