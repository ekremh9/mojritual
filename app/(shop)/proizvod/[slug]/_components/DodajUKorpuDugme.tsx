'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import { MAX_KOLICINA_PO_STAVCI } from '@/lib/domain/cart';
import { formatCijena } from '@/lib/domain/format';
import { izracunajJedinicnuCijenu, type WholesalePrag } from '@/lib/domain/wholesale-tiers';
import { bs } from '@/lib/i18n/bs';

const TRAJANJE_POTVRDE_MS = 1500;

type DodajUKorpuDugmeProps = {
  productId: string;
  /** Redovna cijena po komadu (fening) — osnova za veleprodajni izračun ispod. */
  cijena: number;
  /** Odobren partner (brands.status='odobren') — vidi veleprodajni prikaz umjesto obične +/- kontrole, ali SAMO ako proizvod ima definisane pragove (vidi `veleprodaja` ispod). */
  jePartner: boolean;
  pragovi: WholesalePrag[];
};

/**
 * Dva potpuno odvojena UI-ja za količinu, u istoj komponenti (ne dva fajla)
 * — dijele `kolicina` state i "Dodaj u korpu" dugme/potvrdu, razlika je
 * samo u samoj kontroli za unos i informativnom prikazu ispod nje. Odvajanje
 * u zaseban fajl bi značilo duplirati `dodajUKorpu`/potvrda logiku bez
 * stvarne koristi — ovdje je grananje jednostavno (jedan `if` na render).
 *
 * VELEPRODAJNI prikaz je ISKLJUČIVO informativan: `izracunajJedinicnuCijenu`
 * se poziva samo za uživo prikaz na ovoj stranici. `dodajUKorpu` i dalje šalje
 * samo `productId` + `kolicina`, cijena se ne zaključava ovdje — to je
 * sljedeći, odvojeni korak (vidi cart.ts/cart-data.ts/order-actions.ts,
 * namjerno nedirano).
 */
export function DodajUKorpuDugme({ productId, cijena, jePartner, pragovi }: DodajUKorpuDugmeProps) {
  const { dodajUKorpu } = useCart();
  const [kolicina, setKolicina] = useState(1);
  const [potvrdjeno, setPotvrdjeno] = useState(false);

  const veleprodaja = jePartner && pragovi.length > 0;
  const poruke = bs.proizvod.veleprodaja;

  useEffect(() => {
    if (!potvrdjeno) {
      return;
    }
    const tajmer = setTimeout(() => setPotvrdjeno(false), TRAJANJE_POTVRDE_MS);
    return () => clearTimeout(tajmer);
  }, [potvrdjeno]);

  function handleDodaj() {
    dodajUKorpu(productId, kolicina);
    setPotvrdjeno(true);
  }

  function postaviKolicinuIzUnosa(tekst: string) {
    const broj = Number.parseInt(tekst, 10);
    setKolicina(Number.isFinite(broj) && broj >= 1 ? broj : 1);
  }

  const jedinicnaCijena = veleprodaja ? izracunajJedinicnuCijenu(cijena, kolicina, pragovi) : cijena;

  return (
    <div className="mt-1 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {veleprodaja ? (
          <label className="flex items-center gap-2 text-sm font-medium text-ritual-charcoal">
            {poruke.kolicinaLabela}
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={kolicina}
              onChange={(event) => postaviKolicinuIzUnosa(event.target.value)}
              className="w-24 rounded-full border border-ritual-charcoal/20 px-4 py-2.5 text-center text-sm font-medium text-ritual-charcoal outline-none transition focus:border-ritual-deep-green focus:ring-2 focus:ring-ritual-deep-green/20"
            />
          </label>
        ) : (
          <div className="flex items-center rounded-full border border-ritual-charcoal/20">
            <button
              type="button"
              onClick={() => setKolicina((trenutna) => Math.max(1, trenutna - 1))}
              disabled={kolicina <= 1}
              aria-label={bs.proizvod.smanjiKolicinu}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-ritual-charcoal" aria-live="polite">
              {kolicina}
            </span>
            <button
              type="button"
              onClick={() => setKolicina((trenutna) => Math.min(MAX_KOLICINA_PO_STAVCI, trenutna + 1))}
              disabled={kolicina >= MAX_KOLICINA_PO_STAVCI}
              aria-label={bs.proizvod.povecajKolicinu}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleDodaj}
          className="inline-flex items-center justify-center rounded-full bg-ritual-deep-green px-8 py-3 text-base font-medium text-ritual-warm-white transition-colors hover:bg-ritual-deep-green/90"
        >
          {potvrdjeno ? bs.proizvod.dodanoUKorpu : bs.proizvod.dodajUKorpu}
        </button>
      </div>

      {veleprodaja ? (
        <div className="flex flex-col gap-2 rounded-xl bg-ritual-beige p-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium text-ritual-charcoal">
              {poruke.jedinicnaCijena(formatCijena(jedinicnaCijena))}
            </span>
            {jedinicnaCijena !== cijena ? (
              <span className="text-xs text-ritual-charcoal/50 line-through">{formatCijena(cijena)}</span>
            ) : null}
          </div>
          <span className="text-sm font-medium text-ritual-charcoal">
            {poruke.ukupno(formatCijena(jedinicnaCijena * kolicina))}
          </span>

          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-ritual-charcoal/70">
            {pragovi.map((prag) => (
              <li key={prag.minKolicina}>
                {poruke.pragOpis(
                  prag.minKolicina,
                  formatCijena(Math.round(cijena * (1 - prag.popustPosto / 100))),
                  prag.popustPosto,
                )}
              </li>
            ))}
          </ul>

          <p className="text-xs text-ritual-charcoal/60">{poruke.napomena}</p>
        </div>
      ) : null}
    </div>
  );
}
