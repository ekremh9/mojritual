/**
 * Prebacuje postojeće statične opcije iz `lib/domain/guide-questions.ts`
 * (GUIDE_DODATNA_PITANJA) u `guide_option_templates`, kao seed podataka.
 *
 * Namjerno ODVOJENO od `seed.ts` — ovo je jednokratna migracija postojećeg
 * statičnog sadržaja, ne dio redovnog seed toka za dev/demo podatke.
 *
 * Idempotentno: za svaki (goalId, tekstOpcije) par prvo provjerava da red
 * već ne postoji (nema unique constraint na tu kombinaciju u šemi, pa
 * `onConflictDoNothing` nije primjenjivo — provjera je eksplicitan SELECT
 * prije INSERT-a, kako je i traženo).
 *
 * NE mijenja guide-questions.ts niti sam korisnički tok Vodiča — to ostaje
 * sljedeći korak, kad admin UI i podaci budu spremni.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });

import { and, eq, inArray } from 'drizzle-orm';
import { GUIDE_DODATNA_PITANJA } from '../domain/guide-questions';
import { goals, guideOptionTemplates } from './schema';

type Database = typeof import('./index').db;

async function seedGuideOptions(db: Database) {
  const goalSlugovi = Object.keys(GUIDE_DODATNA_PITANJA);

  const goalRedovi = await db
    .select({ id: goals.id, slug: goals.slug })
    .from(goals)
    .where(inArray(goals.slug, goalSlugovi));

  const goalIdBySlug = new Map(goalRedovi.map((red) => [red.slug, red.id]));

  let kreirano = 0;
  let preskoceno = 0;

  for (const [slug, pitanje] of Object.entries(GUIDE_DODATNA_PITANJA)) {
    const goalId = goalIdBySlug.get(slug);

    if (!goalId) {
      console.warn(`Cilj sa slugom "${slug}" ne postoji u bazi — preskačem njegove opcije.`);
      continue;
    }

    for (const [redoslijed, tekstOpcije] of pitanje.opcije.entries()) {
      const [postojeca] = await db
        .select({ id: guideOptionTemplates.id })
        .from(guideOptionTemplates)
        .where(
          and(
            eq(guideOptionTemplates.goalId, goalId),
            eq(guideOptionTemplates.tekstOpcije, tekstOpcije),
          ),
        )
        .limit(1);

      if (postojeca) {
        preskoceno += 1;
        continue;
      }

      await db.insert(guideOptionTemplates).values({
        goalId,
        tekstOpcije,
        tekstObjasnjenja: null,
        redoslijed,
        aktivan: true,
      });
      kreirano += 1;
    }
  }

  console.log(`Kreirano ${kreirano} opcija, preskočeno ${preskoceno} (već postoje).`);
}

async function main() {
  const { db } = await import('./index');

  await seedGuideOptions(db);

  console.log('Seed opcija Ritual Vodiča završen.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Greška prilikom seed-ovanja opcija Ritual Vodiča:', error);
  process.exit(1);
});
