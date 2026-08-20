'use client';

import { MAX_WHOLESALE_PRAGOVA, type WholesalePrag } from '@/lib/domain/wholesale-tiers';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export type PragRedTekst = { minKolicina: string; popustPosto: string };

const KLASE_POLJA =
  'w-full rounded-xl border border-[#1C2B22]/15 bg-white px-4 py-2.5 text-sm text-[#1C2B22] outline-none transition placeholder:text-[#1C2B22]/40 focus:border-[#16332A] focus:ring-2 focus:ring-[#16332A]/20 disabled:cursor-not-allowed disabled:bg-[#F2F5ED] disabled:text-[#1C2B22]/60';

/**
 * Uvijek tačno `MAX_WHOLESALE_PRAGOVA` redova u UI-ju (popunjeni pragovi +
 * prazni ostatak), bez obzira koliko ih stvarno postoji — dijeli ga forma
 * proizvoda (pragovi po proizvodu) i profil brenda (podrazumijevani
 * pragovi).
 */
export function pocetniPragoviTekst(pragovi: WholesalePrag[] | undefined): PragRedTekst[] {
  const redovi = (pragovi ?? []).map((prag) => ({
    minKolicina: String(prag.minKolicina),
    popustPosto: String(prag.popustPosto),
  }));

  while (redovi.length < MAX_WHOLESALE_PRAGOVA) {
    redovi.push({ minKolicina: '', popustPosto: '' });
  }

  return redovi;
}

/**
 * Kompaktuje UI redove u ono što se stvarno šalje: potpuno prazan red
 * (oba polja prazna) se izostavlja — nije greška, samo neiskorišten prag.
 * Djelimično popunjen red (samo jedno polje) OSTAJE u nizu sa `NaN` na
 * praznom polju — `validirajWholesalePragove` ga onda odbija kroz isti
 * broj/opseg provjeru, ne kao poseban "nepotpun red" slučaj.
 */
export function izracunajPragoveZaSlanje(redovi: PragRedTekst[]): WholesalePrag[] {
  return redovi
    .filter((red) => red.minKolicina.trim() !== '' || red.popustPosto.trim() !== '')
    .map((red) => ({
      minKolicina: red.minKolicina.trim() === '' ? Number.NaN : Number(red.minKolicina),
      popustPosto: red.popustPosto.trim() === '' ? Number.NaN : Number(red.popustPosto),
    }));
}

type WholesalePragoviPoljaProps = {
  redovi: PragRedTekst[];
  onChange: (indeks: number, polje: keyof PragRedTekst, tekst: string) => void;
  greska?: string;
  disabled?: boolean;
  /**
   * Fening cijena za uživo prikaz cijene po komadu ispod svakog reda —
   * izostavi za kontekste bez jedne konkretne cijene (npr. podrazumijevani
   * pragovi partnera, koji važe za više proizvoda različitih cijena).
   */
  cijenaFening?: number;
};

/** 3 reda (količina + popust), sa uživo izračunatom cijenom po komadu kad je `cijenaFening` prosljeđen. Isključivo prikaz/uređivanje — snimanje i validacija su na pozivaocu. */
export function WholesalePragoviPolja({
  redovi,
  onChange,
  greska,
  disabled,
  cijenaFening,
}: WholesalePragoviPoljaProps) {
  const poruke = bs.portal.wholesale;

  return (
    <div className="flex flex-col gap-3">
      {redovi.map((red, indeks) => {
        const minKolicinaNum = Number(red.minKolicina);
        const popustNum = Number(red.popustPosto);
        const prikaziIzracun =
          cijenaFening !== undefined &&
          red.minKolicina.trim() !== '' &&
          red.popustPosto.trim() !== '' &&
          Number.isFinite(minKolicinaNum) &&
          Number.isFinite(popustNum) &&
          Number.isFinite(cijenaFening);
        const cijenaPoKomadu = prikaziIzracun
          ? Math.round(cijenaFening! * (1 - popustNum / 100))
          : null;

        return (
          <div key={indeks} className="flex flex-col gap-2 rounded-xl border border-[#1C2B22]/10 p-3">
            <span className="text-sm font-medium text-[#1C2B22]">{poruke.pragLabela(indeks + 1)}</span>
            <div className="flex flex-wrap gap-3">
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[#1C2B22]/70">
                {poruke.kolicina}
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder={poruke.kolicinaPlaceholder}
                  value={red.minKolicina}
                  disabled={disabled}
                  onChange={(event) => onChange(indeks, 'minKolicina', event.target.value)}
                  className={KLASE_POLJA}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-[#1C2B22]/70">
                {poruke.popust}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={poruke.popustPlaceholder}
                  value={red.popustPosto}
                  disabled={disabled}
                  onChange={(event) => onChange(indeks, 'popustPosto', event.target.value)}
                  className={KLASE_POLJA}
                />
              </label>
            </div>
            {cijenaPoKomadu !== null ? (
              <p className="text-xs text-[#16332A]">
                {poruke.izracunataCijena(minKolicinaNum, formatCijena(cijenaPoKomadu))}
              </p>
            ) : null}
          </div>
        );
      })}

      {greska ? <p className="text-xs text-[#B3261E]">{greska}</p> : null}
    </div>
  );
}
