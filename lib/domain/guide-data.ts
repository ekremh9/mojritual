/**
 * Server-side dohvat podataka za korak 2 Ritual Vodiča (lista ciljeva).
 * Poziva se iz server komponente `/vodic`, ne treba `'use server'`.
 */
import { db } from '@/lib/db';
import { goals } from '@/lib/db/schema';
import { GUIDE_GOAL_SLUG_REDOSLIJED } from './guide-questions';

export type GuideCilj = {
  id: string;
  slug: string;
  naziv: string;
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
