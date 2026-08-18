'use client';

import { useState } from 'react';
import Image from 'next/image';
import { bs } from '@/lib/i18n/bs';

type Slika = { url: string; alt: string | null };

type ProizvodGalerijaProps = {
  slike: Slika[];
  naziv: string;
};

export function ProizvodGalerija({ slike, naziv }: ProizvodGalerijaProps) {
  const [izabraniIndeks, setIzabraniIndeks] = useState(0);
  const glavnaSlika = slike[izabraniIndeks] ?? null;

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#F2F5ED]">
        {glavnaSlika ? (
          <Image
            src={glavnaSlika.url}
            alt={glavnaSlika.alt ?? naziv}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : null}
      </div>
      {slike.length > 1 ? (
        <div className="mt-3 flex gap-3">
          {slike.map((slika, indeks) => (
            <button
              key={slika.url}
              type="button"
              onClick={() => setIzabraniIndeks(indeks)}
              aria-label={bs.proizvod.prikaziSliku(indeks + 1)}
              aria-pressed={indeks === izabraniIndeks}
              className={`relative aspect-square w-20 overflow-hidden rounded-xl bg-[#F2F5ED] border-2 transition-colors ${
                indeks === izabraniIndeks
                  ? 'border-[#16332A]'
                  : 'border-transparent hover:border-[#1C2B22]/20'
              }`}
            >
              <Image
                src={slika.url}
                alt={slika.alt ?? naziv}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
