import type { Product } from '@/lib/db/schema';
import { kmToFening } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

/**
 * Forma za proizvod u portalu — čista domenska logika, bez React zavisnosti.
 *
 * Isti validator koriste forma u portalu i server action. Klijentska
 * validacija je samo pogodnost; granica povjerenja je server, koji ovo
 * pušta ponovo nad podacima koje je primio.
 */

export const MAX_KRATKI_OPIS = 200;

export const PRODUCT_FORME = [
  'kapsula',
  'tableta',
  'prah',
  'tecnost',
  'gel',
  'krema',
  'zvakaca',
] as const satisfies readonly Product['forma'][];

export const PRODUCT_DOSTUPNOSTI = [
  'dostupno',
  'nedostupno',
  'uskoro',
] as const satisfies readonly Product['dostupnost'][];

function jeForma(vrijednost: string): vrijednost is Product['forma'] {
  return (PRODUCT_FORME as readonly string[]).includes(vrijednost);
}

function jeDostupnost(vrijednost: string): vrijednost is Product['dostupnost'] {
  return (PRODUCT_DOSTUPNOSTI as readonly string[]).includes(vrijednost);
}

/** Vrijednosti onako kako ih forma drži — sve tekstualno, KM ne fening. */
export type ProizvodUnos = {
  naziv: string;
  kratkiOpis: string;
  opis: string;
  forma: string;
  kategorije: string[];
  sastojci: string;
  doziranje: string;
  upozorenja: string;
  cijenaKm: string;
  staraCijenaKm: string;
  dostupnost: string;
};

export type PoljeProizvoda = keyof ProizvodUnos;
export type GreskeProizvoda = Partial<Record<PoljeProizvoda, string>>;

/** Vrijednosti spremne za `products` — novac u feninzima, prazno kao `null`. */
export type ProizvodVrijednosti = {
  naziv: string;
  kratkiOpis: string;
  opis: string | null;
  forma: Product['forma'];
  sastojci: string | null;
  doziranje: string | null;
  upozorenja: string | null;
  cijena: number;
  staraCijena: number | null;
  dostupnost: Product['dostupnost'];
  kategorije: string[];
};

function tekst(vrijednost: unknown): string {
  return typeof vrijednost === 'string' ? vrijednost.trim() : '';
}

function iliNull(vrijednost: string): string | null {
  return vrijednost === '' ? null : vrijednost;
}

function nizTekstova(vrijednost: unknown): string[] {
  if (!Array.isArray(vrijednost)) {
    return [];
  }
  return vrijednost.filter((stavka): stavka is string => typeof stavka === 'string');
}

/**
 * Podaci sa klijenta mogu biti bilo šta — action ih prvo provuče kroz ovo,
 * pa tek onda kroz validaciju.
 */
export function normalizujProizvod(data: unknown): ProizvodUnos {
  const izvor = (typeof data === 'object' && data !== null ? data : {}) as Record<
    string,
    unknown
  >;

  return {
    naziv: tekst(izvor.naziv),
    kratkiOpis: tekst(izvor.kratkiOpis),
    opis: tekst(izvor.opis),
    forma: tekst(izvor.forma),
    kategorije: nizTekstova(izvor.kategorije),
    sastojci: tekst(izvor.sastojci),
    doziranje: tekst(izvor.doziranje),
    upozorenja: tekst(izvor.upozorenja),
    cijenaKm: tekst(izvor.cijenaKm),
    staraCijenaKm: tekst(izvor.staraCijenaKm),
    dostupnost: jeDostupnost(tekst(izvor.dostupnost)) ? tekst(izvor.dostupnost) : 'dostupno',
  };
}

export function validirajProizvod(unos: ProizvodUnos): GreskeProizvoda {
  const greske: GreskeProizvoda = {};
  const poruke = bs.portal.proizvodi.forma.validacija;

  if (unos.naziv.trim() === '') {
    greske.naziv = poruke.nazivObavezan;
  }

  const kratkiOpis = unos.kratkiOpis.trim();
  if (kratkiOpis === '') {
    greske.kratkiOpis = poruke.kratkiOpisObavezan;
  } else if (kratkiOpis.length > MAX_KRATKI_OPIS) {
    greske.kratkiOpis = poruke.kratkiOpisDug;
  }

  if (!jeForma(unos.forma)) {
    greske.forma = poruke.formaObavezna;
  }

  if (unos.kategorije.length === 0) {
    greske.kategorije = poruke.kategorijaObavezna;
  }

  const cijenaKm = unos.cijenaKm.trim();
  if (cijenaKm === '') {
    greske.cijenaKm = poruke.cijenaObavezna;
  } else {
    const feninzi = kmToFening(cijenaKm);
    if (!Number.isFinite(feninzi) || feninzi <= 0) {
      greske.cijenaKm = poruke.cijenaNeispravna;
    }
  }

  const staraCijenaKm = unos.staraCijenaKm.trim();
  if (staraCijenaKm !== '') {
    const staraFeninzi = kmToFening(staraCijenaKm);
    const cijenaFeninzi = kmToFening(cijenaKm);

    if (!Number.isFinite(staraFeninzi) || staraFeninzi <= 0) {
      greske.staraCijenaKm = poruke.staraCijenaNeispravna;
    } else if (Number.isFinite(cijenaFeninzi) && staraFeninzi <= cijenaFeninzi) {
      greske.staraCijenaKm = poruke.staraCijenaManja;
    }
  }

  if (!jeDostupnost(unos.dostupnost)) {
    greske.dostupnost = poruke.dostupnostNeispravna;
  }

  return greske;
}

/**
 * Priprema vrijednosti za `products`. Zove se tek nakon validacije —
 * konverzija KM → fening i cast na enum ovdje pretpostavljaju ispravan unos.
 */
export function pripremiProizvod(unos: ProizvodUnos): ProizvodVrijednosti {
  return {
    naziv: unos.naziv.trim(),
    kratkiOpis: unos.kratkiOpis.trim(),
    opis: iliNull(unos.opis.trim()),
    forma: unos.forma as Product['forma'],
    sastojci: iliNull(unos.sastojci.trim()),
    doziranje: iliNull(unos.doziranje.trim()),
    upozorenja: iliNull(unos.upozorenja.trim()),
    cijena: kmToFening(unos.cijenaKm),
    staraCijena: unos.staraCijenaKm.trim() === '' ? null : kmToFening(unos.staraCijenaKm),
    dostupnost: unos.dostupnost as Product['dostupnost'],
    kategorije: unos.kategorije,
  };
}
