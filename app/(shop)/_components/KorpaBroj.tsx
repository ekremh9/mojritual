'use client';

import { useCart } from '@/lib/cart/CartContext';

export function KorpaBroj() {
  const { brojArtikala } = useCart();

  if (brojArtikala === 0) {
    return null;
  }

  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ritual-deep-green text-[10px] font-medium text-white">
      {brojArtikala > 99 ? '99+' : brojArtikala}
    </span>
  );
}
