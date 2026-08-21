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
      aria-label={potvrdjeno ? bs.proizvod.dodanoUKorpu : bs.proizvod.dodajUKorpu}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        potvrdjeno
          ? 'bg-ritual-green text-ritual-deep-green'
          : 'bg-ritual-deep-green text-ritual-warm-white hover:bg-ritual-deep-green/90'
      }`}
    >
      {potvrdjeno ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
