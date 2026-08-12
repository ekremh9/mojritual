'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { formatCijena } from '@/lib/domain/format';
import type { GuideProizvod } from '@/lib/domain/guide';
import { bs } from '@/lib/i18n/bs';

const TRAJANJE_POTVRDE_MS = 1500;

/**
 * Kartica proizvoda u rezultatu Vodiča — slično ProizvodKartica, ali sa
 * odvojenim dugmetom "Dodaj u korpu" van linka (dugme unutar <a> nije
 * ispravno ugniježđivanje).
 */
export function GuideProizvodKartica({ proizvod }: { proizvod: GuideProizvod }) {
  const { dodajUKorpu } = useCart();
  const [potvrdjeno, setPotvrdjeno] = useState(false);

  useEffect(() => {
    if (!potvrdjeno) {
      return;
    }
    const tajmer = setTimeout(() => setPotvrdjeno(false), TRAJANJE_POTVRDE_MS);
    return () => clearTimeout(tajmer);
  }, [potvrdjeno]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-white">
      <Link href={`/proizvod/${proizvod.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full bg-[#F2F5ED]">
          {proizvod.slika ? (
            <Image
              src={proizvod.slika.url}
              alt={proizvod.slika.alt ?? proizvod.naziv}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <span className="text-sm font-medium text-[#1C2B22]">{proizvod.naziv}</span>
          {proizvod.kratkiOpis ? (
            <span className="text-sm text-[#1C2B22]/70">{proizvod.kratkiOpis}</span>
          ) : null}
          <span className="mt-auto pt-2 text-base font-semibold text-[#1C2B22]">
            {formatCijena(proizvod.cijena)}
          </span>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => {
            dodajUKorpu(proizvod.id);
            setPotvrdjeno(true);
          }}
          className="w-full rounded-full bg-[#16332A] px-4 py-2.5 text-sm font-medium text-[#F2F5ED] transition-colors hover:bg-[#16332A]/90"
        >
          {potvrdjeno ? bs.vodic.rezultat.dodanoUKorpu : bs.vodic.rezultat.dodajUKorpu}
        </button>
      </div>
    </div>
  );
}
