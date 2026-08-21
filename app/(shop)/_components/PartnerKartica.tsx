import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Building2, Star } from 'lucide-react';
import { bs } from '@/lib/i18n/bs';

export type PartnerKarticaData = {
  slug: string;
  naziv: string;
  kratkiOpis: string | null;
  logoUrl: string | null;
  verifikovan: boolean;
  /**
   * `brands.istaknut` — opciono jer ga trenutno prosljeđuje samo
   * /partneri (kao inline značka pored "Verifikovan"). Homepage isticanje
   * ide preko zasebnog `istaknuto` propa (korner traka, druga pozicija i
   * tekst — vidi ispod) da se ne dupliraju dvije značke za isto stanje na
   * istoj kartici.
   */
  istaknut?: boolean;
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
      className="relative flex flex-col gap-3 rounded-2xl border border-ritual-charcoal/10 bg-white p-5 transition-shadow hover:shadow-md"
    >
      {istaknuto ? (
        <Star
          aria-label={bs.homepage.istaknutiPartneri.badge}
          className="absolute right-2 top-2 z-10 h-6 w-6 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        />
      ) : null}
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ritual-beige">
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
          <span className="text-sm font-semibold text-ritual-charcoal">{partner.naziv}</span>
          {partner.verifikovan || partner.istaknut ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {partner.verifikovan ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-ritual-green/50 px-2 py-0.5 text-xs font-medium text-ritual-deep-green">
                  <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                  {bs.partneri.verifikovan}
                </span>
              ) : null}
              {partner.istaknut ? (
                <span className="inline-flex w-fit items-center rounded-full bg-ritual-deep-green px-2 py-0.5 text-xs font-medium text-ritual-warm-white">
                  {bs.partneri.istaknut}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {partner.kratkiOpis ? (
        <p className="text-sm text-ritual-charcoal/70">{partner.kratkiOpis}</p>
      ) : null}

      <span className="mt-auto pt-1 text-xs text-[#8A9086]">
        {bs.partneri.brojProizvoda(partner.brojProizvoda)}
      </span>
    </Link>
  );
}
