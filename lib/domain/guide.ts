/**
 * Poslovna logika Ritual Vodiča — čista, bez React i bez baze.
 *
 * Ovo je faza bez AI poziva: rangiranje grupa proizvoda dolazi isključivo
 * iz `product_goals.relevantnost`/`.oznaka`, koje postavlja admin ili
 * medicinski recenzent (CLAUDE.md pravilo 2, spec 13.3). Osnovni podaci i
 * odgovori koraka 3 se bilježe, ali za sada ne utiču na rezultat.
 */

export const STAROSNE_GRUPE = ['<18', '18-30', '31-45', '46-60', '60+'] as const;
export type StarosnaGrupa = (typeof STAROSNE_GRUPE)[number];

export const SPOLOVI = ['M', 'Z'] as const;
export type Spol = (typeof SPOLOVI)[number];

export const MAX_ODABRANIH_CILJEVA = 3;

export type GuideOsnovniPodaci = {
  spol: Spol | null;
  starosnaGrupa: StarosnaGrupa | null;
  /** Značajno samo kad je starosnaGrupa '<18' — vidi zahtjevaPotvrduMaloljetnosti. */
  potvrdaMaloljetnosti: boolean;
};

export type GuideOdgovori = {
  osnovniPodaci: GuideOsnovniPodaci;
  /** goalId, redoslijed odabira iz koraka 2, 1–3 stavke. */
  ciljevi: string[];
  /** goalId → indeks odabrane opcije iz guide-questions.ts. */
  dodatnaPitanja: Record<string, number>;
};

export type GuideProizvod = {
  id: string;
  slug: string;
  naziv: string;
  kratkiOpis: string | null;
  cijena: number;
  slika: { url: string; alt: string | null } | null;
};

export type GuideRezultatGrupa = {
  goalId: string;
  goalSlug: string;
  naziv: string;
  /** Tekst medicinskog recenzenta — prikazuje se prije proizvoda. `null` kad nema aktivnog teksta za cilj. */
  tekstObjasnjenja: string | null;
  proizvodi: GuideProizvod[];
};

export type GuideRezultat = {
  grupe: GuideRezultatGrupa[];
};

/** <18 traži napomenu i potvrdu prije nastavka (spec 4, soft disclaimer — ne blokira trajno). */
export function zahtjevaPotvrduMaloljetnosti(starosnaGrupa: StarosnaGrupa | null): boolean {
  return starosnaGrupa === '<18';
}

/** Da li se korak 1 može preskočiti/nastaviti dalje sa trenutnim stanjem. */
export function mozeNastavitiIzKorak1(osnovniPodaci: GuideOsnovniPodaci): boolean {
  if (!zahtjevaPotvrduMaloljetnosti(osnovniPodaci.starosnaGrupa)) {
    return true;
  }
  return osnovniPodaci.potvrdaMaloljetnosti;
}

/** Cilj je obavezan, 1 do 3 izbora bez duplikata. */
export function validanBrojCiljeva(ciljevi: readonly string[]): boolean {
  const jedinstveni = new Set(ciljevi);
  return jedinstveni.size >= 1 && jedinstveni.size <= MAX_ODABRANIH_CILJEVA;
}

type ProizvodSaRangiranjem = {
  relevantnost: number;
  oznaka: 'primarni' | 'sekundarni';
};

/**
 * Redoslijed proizvoda unutar grupe rezultata: primarni prije sekundarnih,
 * pa opadajuće po relevantnosti. Jedini kriterij ranga u Vodiču — CLAUDE.md
 * pravilo 2, spec 13.3.
 */
export function poredakOznakaIRelevantnosti<T extends ProizvodSaRangiranjem>(a: T, b: T): number {
  if (a.oznaka !== b.oznaka) {
    return a.oznaka === 'primarni' ? -1 : 1;
  }
  return b.relevantnost - a.relevantnost;
}
