'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import { bs } from '@/lib/i18n/bs';

const TRAJANJE_POTVRDE_MS = 1500;

type BrzoDodajUKorpuDugmeProps = {
  productId: string;
  /**
   * Odobreni partner sa definisanim veleprodajnim pragovima za OVAJ
   * proizvod treba ići na stranicu proizvoda da unese količinu kroz
   * textbox (vidi DodajUKorpuDugme) — brzo dugme uvijek šalje količinu 1,
   * što zaobilazi veleprodajni popust, pa se za taj slučaj sakriva.
   */
  imaVeleprodajnePragove: boolean;
};

/**
 * Kompaktno dugme na ProizvodKartica — dodaje 1 komad u korpu bez odlaska
 * na stranicu proizvoda. Izdvojeno u zaseban klijentski fajl (ne cijela
 * ProizvodKartica) da lista proizvoda ostane server-rendered; samo ovo
 * dugme treba CartContext. Kartica je sama `<Link>`, pa klik ovdje mora
 * zaustaviti bubbling da ne pokrene navigaciju (vidi handleClick).
 */
export function BrzoDodajUKorpuDugme({ productId, imaVeleprodajnePragove }: BrzoDodajUKorpuDugmeProps) {
  const { dodajUKorpu, jePartner } = useCart();
  const [potvrdjeno, setPotvrdjeno] = useState(false);

  useEffect(() => {
    if (!potvrdjeno) {
      return;
    }
    const tajmer = setTimeout(() => setPotvrdjeno(false), TRAJANJE_POTVRDE_MS);
    return () => clearTimeout(tajmer);
  }, [potvrdjeno]);

  if (jePartner && imaVeleprodajnePragove) {
    return null;
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dodajUKorpu(productId, 1);
    setPotvrdjeno(true);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
        potvrdjeno
          ? 'bg-ritual-green text-ritual-deep-green'
          : 'bg-ritual-deep-green text-ritual-warm-white hover:bg-ritual-deep-green/90'
      }`}
    >
      {potvrdjeno ? (
        <>
          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {bs.proizvod.dodanoUKorpu}
        </>
      ) : (
        <>
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {bs.proizvod.uKorpu}
        </>
      )}
    </button>
  );
}
