import Image from 'next/image';
import Link from 'next/link';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

export type ProizvodKarticaData = {
  id: string;
  slug: string;
  naziv: string;
  kratkiOpis: string | null;
  cijena: number;
  slika: { url: string; alt: string | null } | null;
};

type ProizvodKarticaProps = {
  proizvod: ProizvodKarticaData;
  /**
   * Prikazuje "Istaknuto" značku — SAMO kad je proizvod stvarno istaknut
   * (products.istaknutStatus='odobreno'), ne fallback popuna. Prosljeđuje
   * se isključivo sa homepagea (vidi app/(shop)/page.tsx); Shop stranica i
   * stranica partnera je namjerno ne prosljeđuju, da značka ne izgubi
   * značenje van tog konteksta.
   */
  istaknuto?: boolean;
};

export function ProizvodKartica({ proizvod, istaknuto }: ProizvodKarticaProps) {
  return (
    <Link
      href={`/proizvod/${proizvod.slug}`}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-white transition-shadow hover:shadow-md"
    >
      {istaknuto ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-[#16332A] px-2.5 py-1 text-xs font-medium text-[#F2F5ED]">
          {bs.homepage.istaknutiProizvodi.badge}
        </span>
      ) : null}
      <div className="relative aspect-square w-full bg-[#F2F5ED]">
        {proizvod.slika ? (
          <Image
            src={proizvod.slika.url}
            alt={proizvod.slika.alt ?? proizvod.naziv}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
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
  );
}
