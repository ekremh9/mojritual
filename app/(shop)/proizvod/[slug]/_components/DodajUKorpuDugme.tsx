'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCart } from '@/lib/cart/CartContext';
import { MAX_KOLICINA_PO_STAVCI } from '@/lib/domain/cart';
import { bs } from '@/lib/i18n/bs';

const TRAJANJE_POTVRDE_MS = 1500;

export function DodajUKorpuDugme({ productId }: { productId: string }) {
  const { dodajUKorpu } = useCart();
  const [kolicina, setKolicina] = useState(1);
  const [potvrdjeno, setPotvrdjeno] = useState(false);

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

  return (
    <div className="mt-1 flex items-center gap-3">
      <div className="flex items-center rounded-full border border-[#1C2B22]/20">
        <button
          type="button"
          onClick={() => setKolicina((trenutna) => Math.max(1, trenutna - 1))}
          disabled={kolicina <= 1}
          aria-label={bs.proizvod.smanjiKolicinu}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium text-[#1C2B22]" aria-live="polite">
          {kolicina}
        </span>
        <button
          type="button"
          onClick={() => setKolicina((trenutna) => Math.min(MAX_KOLICINA_PO_STAVCI, trenutna + 1))}
          disabled={kolicina >= MAX_KOLICINA_PO_STAVCI}
          aria-label={bs.proizvod.povecajKolicinu}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#1C2B22] transition-colors hover:bg-[#F2F5ED] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleDodaj}
        className="inline-flex items-center justify-center rounded-full bg-[#16332A] px-8 py-3 text-base font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
      >
        {potvrdjeno ? bs.proizvod.dodanoUKorpu : bs.proizvod.dodajUKorpu}
      </button>
    </div>
  );
}
