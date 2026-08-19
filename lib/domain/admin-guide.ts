/**
 * Ciljevi Ritual Vodiča i njihova veza sa proizvodima — za admin/medicinskog
 * recenzenta. Redoslijed preporuke u samom Vodiču određuje isključivo ova
 * zdravstvena logika (relevantnost, oznaka), nikad komercijalni podaci.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  brands,
  goals,
  guideExplanationTemplates,
  guideOptionTemplates,
  productGoalProposals,
  productGoals,
  productImages,
  products,
} from '@/lib/db/schema';
import type { Product } from '@/lib/db/schema';

export type AdminCiljPregled = {
  id: string;
  slug: string;
  naziv: string;
  brojProizvoda: number;
  imaAktivanTekst: boolean;
};

/** Svi ciljevi sa brojem vezanih proizvoda i da li imaju aktivan tekst objašnjenja. */
export async function getGoalsOverview(): Promise<AdminCiljPregled[]> {
  const sviCiljevi = await db
    .select({ id: goals.id, slug: goals.slug, naziv: goals.naziv })
    .from(goals)
    .orderBy(asc(goals.naziv));

  if (sviCiljevi.length === 0) {
    return [];
  }

  const ids = sviCiljevi.map((cilj) => cilj.id);

  const vezaniProizvodiRedovi = await db
    .select({ goalId: productGoals.goalId, productId: productGoals.productId })
    .from(productGoals)
    .where(inArray(productGoals.goalId, ids));

  const brojPoCilju = new Map<string, number>();
  for (const red of vezaniProizvodiRedovi) {
    brojPoCilju.set(red.goalId, (brojPoCilju.get(red.goalId) ?? 0) + 1);
  }

  const aktivniTekstoviRedovi = await db
    .select({ goalId: guideExplanationTemplates.goalId })
    .from(guideExplanationTemplates)
    .where(
      and(
        inArray(guideExplanationTemplates.goalId, ids),
        eq(guideExplanationTemplates.aktivan, true),
      ),
    );

  const imaTekstSkup = new Set(aktivniTekstoviRedovi.map((red) => red.goalId));

  return sviCiljevi.map((cilj) => ({
    id: cilj.id,
    slug: cilj.slug,
    naziv: cilj.naziv,
    brojProizvoda: brojPoCilju.get(cilj.id) ?? 0,
    imaAktivanTekst: imaTekstSkup.has(cilj.id),
  }));
}

export type AdminCiljProizvod = {
  id: string;
  naziv: string;
  brend: { naziv: string };
  slika: { url: string; alt: string | null } | null;
  vezan: boolean;
  relevantnost: number | null;
  oznaka: 'primarni' | 'sekundarni' | null;
  /**
   * `null` = partner nije predložio ovaj cilj za proizvod. Inače
   * `obradjenoAt: null` = nov prijedlog, još ga niko nije pregledao;
   * `obradjenoAt: Date` = recenzent je već postavio vezu za ovaj prijedlog.
   */
  prijedlogPartnera: { obradjenoAt: Date | null } | null;
  istaknutStatus: Product['istaknutStatus'];
};

export type AdminCiljOpcija = {
  id: string;
  tekstOpcije: string;
  tekstObjasnjenja: string | null;
  redoslijed: number;
};

export type AdminCiljDetalj = {
  id: string;
  slug: string;
  naziv: string;
  opis: string | null;
  aktivanTekst: { id: string; tekst: string } | null;
  opcije: AdminCiljOpcija[];
  proizvodi: AdminCiljProizvod[];
};

/** Aktivne opcije za dodatno pitanje (korak 3 Vodiča), sortirane po redoslijedu. */
async function getGoalOptions(goalId: string): Promise<AdminCiljOpcija[]> {
  return db
    .select({
      id: guideOptionTemplates.id,
      tekstOpcije: guideOptionTemplates.tekstOpcije,
      tekstObjasnjenja: guideOptionTemplates.tekstObjasnjenja,
      redoslijed: guideOptionTemplates.redoslijed,
    })
    .from(guideOptionTemplates)
    .where(and(eq(guideOptionTemplates.goalId, goalId), eq(guideOptionTemplates.aktivan, true)))
    .orderBy(asc(guideOptionTemplates.redoslijed));
}

/**
 * Cilj sa aktivnim tekstom objašnjenja i svim odobrenim proizvodima u
 * platformi — ne samo trenutno vezanim za ovaj cilj, jer recenzent treba
 * moći dodati novu vezu direktno sa ove stranice.
 */
export async function getGoalDetail(goalId: string): Promise<AdminCiljDetalj | null> {
  const [cilj] = await db
    .select({ id: goals.id, slug: goals.slug, naziv: goals.naziv, opis: goals.opis })
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);

  if (!cilj) {
    return null;
  }

  const [aktivanTekst] = await db
    .select({ id: guideExplanationTemplates.id, tekst: guideExplanationTemplates.tekst })
    .from(guideExplanationTemplates)
    .where(
      and(eq(guideExplanationTemplates.goalId, goalId), eq(guideExplanationTemplates.aktivan, true)),
    )
    .limit(1);

  const opcije = await getGoalOptions(goalId);

  const odobreniProizvodi = await db
    .select({
      id: products.id,
      naziv: products.naziv,
      brendNaziv: brands.naziv,
      istaknutStatus: products.istaknutStatus,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .where(eq(products.status, 'odobren'))
    .orderBy(asc(products.naziv));

  if (odobreniProizvodi.length === 0) {
    return {
      id: cilj.id,
      slug: cilj.slug,
      naziv: cilj.naziv,
      opis: cilj.opis,
      aktivanTekst: aktivanTekst ?? null,
      opcije,
      proizvodi: [],
    };
  }

  const ids = odobreniProizvodi.map((proizvod) => proizvod.id);

  const slike = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
      redoslijed: productImages.redoslijed,
    })
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.redoslijed));

  const prvaSlikaPoProizvodu = new Map<string, { url: string; alt: string | null }>();
  for (const slika of slike) {
    if (!prvaSlikaPoProizvodu.has(slika.productId)) {
      prvaSlikaPoProizvodu.set(slika.productId, { url: slika.url, alt: slika.alt });
    }
  }

  const vezeZaOvajCilj = await db
    .select({
      productId: productGoals.productId,
      relevantnost: productGoals.relevantnost,
      oznaka: productGoals.oznaka,
    })
    .from(productGoals)
    .where(and(eq(productGoals.goalId, goalId), inArray(productGoals.productId, ids)));

  const vezaPoProizvodu = new Map(vezeZaOvajCilj.map((veza) => [veza.productId, veza]));

  const prijedloziZaOvajCilj = await db
    .select({ productId: productGoalProposals.productId, obradjenoAt: productGoalProposals.obradjenoAt })
    .from(productGoalProposals)
    .where(and(eq(productGoalProposals.goalId, goalId), inArray(productGoalProposals.productId, ids)));

  const prijedlogPoProizvodu = new Map(
    prijedloziZaOvajCilj.map((red) => [red.productId, red.obradjenoAt]),
  );

  const proizvodi: AdminCiljProizvod[] = odobreniProizvodi.map((proizvod) => {
    const veza = vezaPoProizvodu.get(proizvod.id);
    const imaPrijedlog = prijedlogPoProizvodu.has(proizvod.id);

    return {
      id: proizvod.id,
      naziv: proizvod.naziv,
      brend: { naziv: proizvod.brendNaziv },
      slika: prvaSlikaPoProizvodu.get(proizvod.id) ?? null,
      vezan: veza !== undefined,
      relevantnost: veza?.relevantnost ?? null,
      oznaka: veza?.oznaka ?? null,
      prijedlogPartnera: imaPrijedlog
        ? { obradjenoAt: prijedlogPoProizvodu.get(proizvod.id) ?? null }
        : null,
      istaknutStatus: proizvod.istaknutStatus,
    };
  });

  return {
    id: cilj.id,
    slug: cilj.slug,
    naziv: cilj.naziv,
    opis: cilj.opis,
    aktivanTekst: aktivanTekst ?? null,
    opcije,
    proizvodi,
  };
}
