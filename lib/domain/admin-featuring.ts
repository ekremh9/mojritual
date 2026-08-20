import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { featuringPricePlans } from '@/lib/db/schema';
import type { FeaturingPricePlan } from '@/lib/db/schema';

/**
 * Paketi cjenovnika isticanja za admin pregled, opciono filtrirani po tipu
 * ('proizvod' ili 'brend'). Prikazuje i neaktivne pakete — admin ekran je
 * jedino mjesto gdje se oni uopšte vide (javni tok ih još ne čita).
 */
export async function getFeaturingPlans(tip?: FeaturingPricePlan['tip']): Promise<FeaturingPricePlan[]> {
  if (tip) {
    return db
      .select()
      .from(featuringPricePlans)
      .where(eq(featuringPricePlans.tip, tip))
      .orderBy(asc(featuringPricePlans.redoslijed));
  }

  return db.select().from(featuringPricePlans).orderBy(asc(featuringPricePlans.redoslijed));
}
