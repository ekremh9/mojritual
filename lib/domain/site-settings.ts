'use server';

/**
 * Globalne postavke sajta — koristi postojeću `settings` tabelu
 * (key-value, `vrijednost` jsonb), ne posebnu tabelu. Za sada samo
 * hero slika homepagea; buduće postavke dodaju svoj `kljuc` ovdje.
 */
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { bs } from '@/lib/i18n/bs';

const HERO_SLIKA_KLJUC = 'hero_slika_url';

export type SiteSettingsRezultat = { ok: true } | { ok: false; error: string };

/** Hero slika homepagea — `null` znači "nije postavljena", hero prikazuje gradient fallback (vidi app/(shop)/page.tsx). */
export async function getHeroImageUrl(): Promise<string | null> {
  const [red] = await db
    .select({ vrijednost: settings.vrijednost })
    .from(settings)
    .where(eq(settings.kljuc, HERO_SLIKA_KLJUC))
    .limit(1);

  if (!red) {
    return null;
  }

  return typeof red.vrijednost === 'string' ? red.vrijednost : null;
}

/**
 * Postavlja hero sliku (ili je uklanja kad je `url` `null`) — admin-only.
 * Poziva se iz `uploadHeroImageAction`/`removeHeroImageAction`
 * (lib/storage/upload-actions.ts), koje se brinu o samom fajlu na R2;
 * ova funkcija samo upisuje/briše red u `settings`, ponavlja admin
 * provjeru nezavisno (svaka akcija to radi, ne oslanja se na pozivaoca).
 */
export async function setHeroImageUrl(url: string | null): Promise<SiteSettingsRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    if (url === null) {
      await db.delete(settings).where(eq(settings.kljuc, HERO_SLIKA_KLJUC));
    } else {
      await db
        .insert(settings)
        .values({ kljuc: HERO_SLIKA_KLJUC, vrijednost: url })
        .onConflictDoUpdate({ target: settings.kljuc, set: { vrijednost: url } });
    }

    revalidatePath('/');
    revalidatePath('/admin/postavke');

    return { ok: true };
  } catch {
    console.error('setHeroImageUrl: snimanje hero slike nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}
