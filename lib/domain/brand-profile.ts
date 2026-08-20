import { kmToFening } from '@/lib/domain/format';
import {
  nizWholesalePragova,
  validirajWholesalePragove,
  type WholesalePrag,
} from '@/lib/domain/wholesale-tiers';
import { bs } from '@/lib/i18n/bs';

/**
 * Profil brenda — čista domenska logika, bez React zavisnosti.
 *
 * Isti validator koriste forma u portalu i server action. Klijentska
 * validacija je samo pogodnost; granica povjerenja je server, koji ovo
 * pušta ponovo nad podacima koje je primio.
 */

export const MAX_KRATKI_OPIS = 200;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB_FORMAT = /^https?:\/\/[^\s/?#.]+\.[^\s]{2,}$/;

/** Vrijednosti onako kako ih forma drži — sve tekstualno, KM ne fening. */
export type BrandProfilUnos = {
  naziv: string;
  kratkiOpis: string;
  prica: string;
  web: string;
  email: string;
  telefon: string;
  jib: string;
  pdvBroj: string;
  adresa: string;
  cijenaDostaveKm: string;
  pragBesplatneDostaveKm: string;
  nemaBesplatneDostave: boolean;
  /**
   * Podrazumijevani veleprodajni pragovi (`brand_wholesale_defaults`) — do
   * 3 nivoa, opciono. SAMO prečica za popunjavanje forme proizvoda
   * ("Primijeni podrazumijevane pragove") — ne ulazi ni u kakav obračun
   * cijene sam po sebi, izvor istine za narudžbu ostaje isključivo
   * `wholesale_price_tiers` na proizvodu.
   */
  wholesaleDefaults?: WholesalePrag[];
};

export type PoljeProfila = keyof BrandProfilUnos;
export type GreskeProfila = Partial<Record<PoljeProfila, string>>;

/** Vrijednosti spremne za `brands` — novac u feninzima, prazno kao `null`. */
export type BrandProfilVrijednosti = {
  naziv: string;
  kratkiOpis: string;
  prica: string | null;
  web: string | null;
  email: string | null;
  telefon: string | null;
  jib: string;
  pdvBroj: string | null;
  adresa: string | null;
  cijenaDostave: number;
  pragBesplatneDostave: number | null;
  wholesaleDefaults: WholesalePrag[];
};

function tekst(vrijednost: unknown): string {
  return typeof vrijednost === 'string' ? vrijednost.trim() : '';
}

function iliNull(vrijednost: string): string | null {
  return vrijednost === '' ? null : vrijednost;
}

/**
 * Web adresa bez protokola je česta greška u unosu — dopunjavamo `https://`
 * umjesto da odbijemo unos.
 */
export function normalizujWeb(web: string): string {
  const ocisceno = web.trim();

  if (ocisceno === '') {
    return '';
  }

  return /^https?:\/\//i.test(ocisceno) ? ocisceno : `https://${ocisceno}`;
}

/**
 * Podaci sa klijenta mogu biti bilo šta — action ih prvo provuče kroz ovo,
 * pa tek onda kroz validaciju.
 */
export function normalizujBrandProfil(data: unknown): BrandProfilUnos {
  const izvor = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;

  return {
    naziv: tekst(izvor.naziv),
    kratkiOpis: tekst(izvor.kratkiOpis),
    prica: tekst(izvor.prica),
    web: tekst(izvor.web),
    email: tekst(izvor.email).toLowerCase(),
    telefon: tekst(izvor.telefon),
    jib: tekst(izvor.jib),
    pdvBroj: tekst(izvor.pdvBroj),
    adresa: tekst(izvor.adresa),
    cijenaDostaveKm: tekst(izvor.cijenaDostaveKm),
    pragBesplatneDostaveKm: tekst(izvor.pragBesplatneDostaveKm),
    nemaBesplatneDostave: izvor.nemaBesplatneDostave === true,
    wholesaleDefaults: nizWholesalePragova(izvor.wholesaleDefaults),
  };
}

export function validirajBrandProfil(unos: BrandProfilUnos): GreskeProfila {
  const greske: GreskeProfila = {};
  const poruke = bs.portal.profil.validacija;

  if (unos.naziv.trim() === '') {
    greske.naziv = poruke.nazivObavezan;
  }

  const kratkiOpis = unos.kratkiOpis.trim();
  if (kratkiOpis === '') {
    greske.kratkiOpis = poruke.kratkiOpisObavezan;
  } else if (kratkiOpis.length > MAX_KRATKI_OPIS) {
    greske.kratkiOpis = poruke.kratkiOpisDug;
  }

  const web = normalizujWeb(unos.web);
  if (web !== '' && !WEB_FORMAT.test(web)) {
    greske.web = poruke.webNeispravan;
  }

  const email = unos.email.trim();
  if (email !== '' && !EMAIL_FORMAT.test(email)) {
    greske.email = poruke.emailNeispravan;
  }

  // JIB je obavezan jer brend, ne platforma, izdaje račun kupcu (spec 16.1).
  if (unos.jib.trim() === '') {
    greske.jib = poruke.jibObavezan;
  }

  // Cijena dostave se traži eksplicitno, i kad je 0 (spec 10.5). Default iz
  // baze nije odluka brenda — nula unesena greškom znači da kupac vidi
  // besplatnu dostavu, a brend očekuje naplatu.
  const cijenaDostaveKm = unos.cijenaDostaveKm.trim();
  if (cijenaDostaveKm === '') {
    greske.cijenaDostaveKm = poruke.cijenaDostaveObavezna;
  } else {
    const feninzi = kmToFening(cijenaDostaveKm);
    if (!Number.isFinite(feninzi) || feninzi < 0) {
      greske.cijenaDostaveKm = poruke.cijenaDostaveNeispravna;
    }
  }

  // Ili iznos, ili izričito „nema besplatne dostave" — prazno polje bez
  // oznake nije odluka (spec 10.5).
  if (!unos.nemaBesplatneDostave) {
    const pragKm = unos.pragBesplatneDostaveKm.trim();

    if (pragKm === '') {
      greske.pragBesplatneDostaveKm = poruke.pragObavezan;
    } else {
      const feninzi = kmToFening(pragKm);
      if (!Number.isFinite(feninzi) || feninzi < 0) {
        greske.pragBesplatneDostaveKm = poruke.pragNeispravan;
      }
    }
  }

  const wholesaleGreska = validirajWholesalePragove(unos.wholesaleDefaults, {
    max: poruke.wholesalePragoviMax,
    kolicinaNeispravna: poruke.wholesalePragoviKolicinaNeispravna,
    kolicinaRastuce: poruke.wholesalePragoviKolicinaRastuce,
    popustNeispravan: poruke.wholesalePragoviPopustNeispravan,
    popustRastuce: poruke.wholesalePragoviPopustRastuce,
  });
  if (wholesaleGreska) {
    greske.wholesaleDefaults = wholesaleGreska;
  }

  return greske;
}

/**
 * Priprema vrijednosti za `brands`. Zove se tek nakon validacije —
 * konverzija KM → fening ovdje pretpostavlja ispravan unos.
 */
export function pripremiBrandProfil(unos: BrandProfilUnos): BrandProfilVrijednosti {
  return {
    naziv: unos.naziv.trim(),
    kratkiOpis: unos.kratkiOpis.trim(),
    prica: iliNull(unos.prica.trim()),
    web: iliNull(normalizujWeb(unos.web)),
    email: iliNull(unos.email.trim().toLowerCase()),
    telefon: iliNull(unos.telefon.trim()),
    jib: unos.jib.trim(),
    pdvBroj: iliNull(unos.pdvBroj.trim()),
    adresa: iliNull(unos.adresa.trim()),
    cijenaDostave: kmToFening(unos.cijenaDostaveKm),
    pragBesplatneDostave: unos.nemaBesplatneDostave
      ? null
      : kmToFening(unos.pragBesplatneDostaveKm),
    wholesaleDefaults: unos.wholesaleDefaults ?? [],
  };
}
