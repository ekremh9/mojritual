'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';
import type { ShopFilteri } from '@/lib/domain/shop-query';
import { shopHref } from './ShopFilters';

type ShopPaginacijaProps = {
  filteri: ShopFilteri;
  stranica: number;
  ukupnoStranica: number;
};

export function ShopPaginacija({ filteri, stranica, ukupnoStranica }: ShopPaginacijaProps) {
  const router = useRouter();
  const [uToku, pocniPrelaz] = useTransition();

  if (ukupnoStranica <= 1) {
    return null;
  }

  function naStranicu(ciljna: number) {
    pocniPrelaz(() => {
      router.push(shopHref({ ...filteri, stranica: ciljna }));
    });
  }

  const imaPrethodnu = stranica > 1;
  const imaSljedecu = stranica < ukupnoStranica;
  const dugmeKlase =
    'inline-flex items-center gap-1.5 rounded-full border border-ritual-charcoal/20 px-5 py-2 text-sm font-medium text-ritual-charcoal transition-colors hover:bg-ritual-beige disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <nav
      aria-label={bs.shop.paginacija.naslov}
      className="mt-10 flex items-center justify-between gap-4"
    >
      <button
        type="button"
        onClick={() => naStranicu(stranica - 1)}
        disabled={!imaPrethodnu || uToku}
        className={dugmeKlase}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {bs.shop.paginacija.prethodna}
      </button>

      <span aria-live="polite" className="text-sm text-ritual-charcoal/70">
        {bs.shop.paginacija.stranicaOd(stranica, ukupnoStranica)}
      </span>

      <button
        type="button"
        onClick={() => naStranicu(stranica + 1)}
        disabled={!imaSljedecu || uToku}
        className={dugmeKlase}
      >
        {bs.shop.paginacija.sljedeca}
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
