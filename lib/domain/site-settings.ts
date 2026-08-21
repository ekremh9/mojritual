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
const HERO_STATISTIKE_KLJUC = 'prikazi_hero_statistike';
const HERO_NASLOV_KLJUC = 'hero_naslov';
const HERO_OPIS_KLJUC = 'hero_opis';
const FOOTER_OPIS_KLJUC = 'footer_opis';

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

/** Da li se statistike (broj proizvoda/partnera/kategorija) prikazuju na hero sekciji — `true` ako ključ ne postoji (default uključeno). */
export async function getShowHeroStats(): Promise<boolean> {
  const [red] = await db
    .select({ vrijednost: settings.vrijednost })
    .from(settings)
    .where(eq(settings.kljuc, HERO_STATISTIKE_KLJUC))
    .limit(1);

  if (!red) {
    return true;
  }

  return red.vrijednost !== false;
}

/** Uključuje/isključuje hero statistike — admin-only, isti obrazac kao `setHeroImageUrl`. */
export async function setShowHeroStats(prikazi: boolean): Promise<SiteSettingsRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    await db
      .insert(settings)
      .values({ kljuc: HERO_STATISTIKE_KLJUC, vrijednost: prikazi })
      .onConflictDoUpdate({ target: settings.kljuc, set: { vrijednost: prikazi } });

    revalidatePath('/');
    revalidatePath('/admin/postavke');

    return { ok: true };
  } catch {
    console.error('setShowHeroStats: snimanje postavke hero statistika nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/** Čita tekstualnu postavku, `podrazumijevano` ako ključ ne postoji ili je prazan/neispravan tip — dijele je get* funkcije ispod, ne izlazi se van fajla. */
async function getTekstPostavku(kljuc: string, podrazumijevano: string): Promise<string> {
  const [red] = await db
    .select({ vrijednost: settings.vrijednost })
    .from(settings)
    .where(eq(settings.kljuc, kljuc))
    .limit(1);

  if (!red || typeof red.vrijednost !== 'string' || red.vrijednost.trim() === '') {
    return podrazumijevano;
  }

  return red.vrijednost;
}

/** Upisuje tekstualnu postavku — admin-only, prazan tekst se odbija (prikazani tekst na sajtu ne smije nestati). Dijele je set* funkcije ispod. */
async function setTekstPostavku(kljuc: string, vrijednost: string): Promise<SiteSettingsRezultat> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'admin') {
      return { ok: false, error: bs.admin.greskaPristup };
    }

    const trimovano = vrijednost.trim();
    if (trimovano === '') {
      return { ok: false, error: bs.admin.postavke.tekstoviSajta.greskaPrazno };
    }

    await db
      .insert(settings)
      .values({ kljuc, vrijednost: trimovano })
      .onConflictDoUpdate({ target: settings.kljuc, set: { vrijednost: trimovano } });

    revalidatePath('/');
    revalidatePath('/admin/postavke');

    return { ok: true };
  } catch {
    console.error('setTekstPostavku: snimanje teksta na sajtu nije uspjelo');
    return { ok: false, error: bs.admin.greskaOpsta };
  }
}

/** Hero naslov na početnoj — podrazumijeva trenutni hardkodirani tekst (bs.homepage.hero.naslov) ako ključ ne postoji. */
export async function getHeroNaslov(): Promise<string> {
  return getTekstPostavku(HERO_NASLOV_KLJUC, bs.homepage.hero.naslov);
}

/** Postavlja hero naslov — admin-only, isti obrazac kao `setHeroImageUrl`. */
export async function setHeroNaslov(vrijednost: string): Promise<SiteSettingsRezultat> {
  return setTekstPostavku(HERO_NASLOV_KLJUC, vrijednost);
}

/** Hero opis (podnaslov) na početnoj — podrazumijeva trenutni hardkodirani tekst (bs.homepage.hero.podnaslov) ako ključ ne postoji. */
export async function getHeroOpis(): Promise<string> {
  return getTekstPostavku(HERO_OPIS_KLJUC, bs.homepage.hero.podnaslov);
}

/** Postavlja hero opis — admin-only, isti obrazac kao `setHeroImageUrl`. */
export async function setHeroOpis(vrijednost: string): Promise<SiteSettingsRezultat> {
  return setTekstPostavku(HERO_OPIS_KLJUC, vrijednost);
}

/** Opis ispod "RITUAL" u brend koloni Footera — podrazumijeva trenutni hardkodirani tekst (bs.footer.brend.opis) ako ključ ne postoji. */
export async function getFooterOpis(): Promise<string> {
  return getTekstPostavku(FOOTER_OPIS_KLJUC, bs.footer.brend.opis);
}

/** Postavlja footer opis — admin-only, isti obrazac kao `setHeroImageUrl`. */
export async function setFooterOpis(vrijednost: string): Promise<SiteSettingsRezultat> {
  return setTekstPostavku(FOOTER_OPIS_KLJUC, vrijednost);
}
