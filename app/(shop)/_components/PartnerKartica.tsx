import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Building2 } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';

export type PartnerKarticaData = {
  slug: string;
  naziv: string;
  kratkiOpis: string | null;
  logoUrl: string | null;
  verifikovan: boolean;
  brojProizvoda: number;
};

type PartnerKarticaProps = {
  partner: PartnerKarticaData;
  /**
   * Prikazuje "Istaknuti partner" značku — SAMO kad je partner stvarno
   * istaknut (brands.istaknut=true), ne fallback popuna. Prosljeđuje se
   * isključivo sa homepagea (vidi app/(shop)/page.tsx); stranica /partneri
   * je namjerno ne prosljeđuje, da značka ne izgubi značenje van tog
   * konteksta.
   */
  istaknuto?: boolean;
};

export function PartnerKartica({ partner, istaknuto }: PartnerKarticaProps) {
  return (
    <Link
      href={`/partner/${partner.slug}`}
      className="relative flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-5 transition-shadow hover:shadow-md"
    >
      {istaknuto ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-[#16332A] px-2.5 py-1 text-xs font-medium text-[#F2F5ED]">
          {bs.homepage.istaknutiPartneri.badge}
        </span>
      ) : null}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F2F5ED]">
          {partner.logoUrl ? (
            <Image
              src={partner.logoUrl}
              alt={partner.naziv}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-6 w-6 text-[#8A9086]" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-semibold text-[#1C2B22]">{partner.naziv}</span>
          {partner.verifikovan ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#C7D6BA]/50 px-2 py-0.5 text-xs font-medium text-[#16332A]">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              {bs.partneri.verifikovan}
            </span>
          ) : null}
        </div>
      </div>

      {partner.kratkiOpis ? (
        <p className="text-sm text-[#1C2B22]/70">{partner.kratkiOpis}</p>
      ) : null}

      <span className="mt-auto pt-1 text-xs text-[#8A9086]">
        {bs.partneri.brojProizvoda(partner.brojProizvoda)}
      </span>
    </Link>
  );
}
