/**
 * Veleprodajni pragovi (količina + procenat popusta, do 3 nivoa) — dijele
 * ga `product-form.ts` (pragovi po proizvodu, `wholesale_price_tiers`) i
 * `brand-profile.ts` (podrazumijevani pragovi partnera,
 * `brand_wholesale_defaults`). Ista pravila na oba mjesta, čisto ovdje —
 * bez React/DB zavisnosti, poruke se ubrizgavaju da funkcija ne zna za
 * konkretan `bs.*` put pozivaoca.
 */

export type WholesalePrag = { minKolicina: number; popustPosto: number };

export const MAX_WHOLESALE_PRAGOVA = 3;

/**
 * Ne odbacuje nijednu stavku i ne skraćuje na `MAX_WHOLESALE_PRAGOVA` — to
 * je posao validacije (mora imati šta da odbije za "max 3 stavke"). Svako
 * polje koje nije broj postaje `NaN`, isti obrazac kao `kmToFening`:
 * validacija ga odbija, pozivalac se ne oslanja na tihu konverziju.
 */
export function nizWholesalePragova(vrijednost: unknown): WholesalePrag[] {
  if (!Array.isArray(vrijednost)) {
    return [];
  }

  return vrijednost.map((stavka) => {
    const izvor = (typeof stavka === 'object' && stavka !== null ? stavka : {}) as Record<
      string,
      unknown
    >;

    return {
      minKolicina: typeof izvor.minKolicina === 'number' ? izvor.minKolicina : Number(izvor.minKolicina),
      popustPosto: typeof izvor.popustPosto === 'number' ? izvor.popustPosto : Number(izvor.popustPosto),
    };
  });
}

export type WholesalePragoviPoruke = {
  max: string;
  kolicinaNeispravna: string;
  kolicinaRastuce: string;
  popustNeispravan: string;
  popustRastuce: string;
};

/**
 * Vraća JEDNU poruku greške (prva relevantna provjera koja ne prođe) ili
 * `undefined` ako je niz validan (uključujući prazan niz — pragovi su
 * opciono polje).
 *
 * Pravila: max 3 stavke; `minKolicina` pozitivan cijeli broj; `popustPosto`
 * broj 0–100; `minKolicina` STROGO rastuća (dva praga sa istom količinom
 * nemaju smisla); `popustPosto` ne smije OPASTI sa većim pragom (smije
 * ostati isti — veći prag ne smije nositi manji popust od manjeg).
 */
export function validirajWholesalePragove(
  pragovi: WholesalePrag[] | undefined,
  poruke: WholesalePragoviPoruke,
): string | undefined {
  const lista = pragovi ?? [];

  if (lista.length > MAX_WHOLESALE_PRAGOVA) {
    return poruke.max;
  }

  const svePolja = lista.every((prag) => Number.isInteger(prag.minKolicina) && prag.minKolicina > 0);
  if (!svePolja) {
    return poruke.kolicinaNeispravna;
  }

  const sviPopusti = lista.every(
    (prag) => Number.isFinite(prag.popustPosto) && prag.popustPosto >= 0 && prag.popustPosto <= 100,
  );
  if (!sviPopusti) {
    return poruke.popustNeispravan;
  }

  for (let i = 1; i < lista.length; i++) {
    if (lista[i]!.minKolicina <= lista[i - 1]!.minKolicina) {
      return poruke.kolicinaRastuce;
    }
  }

  for (let i = 1; i < lista.length; i++) {
    if (lista[i]!.popustPosto < lista[i - 1]!.popustPosto) {
      return poruke.popustRastuce;
    }
  }

  return undefined;
}
