import type { Metadata } from 'next';
import Image from 'next/image';
import { AlertTriangle, Info } from 'lucide-react';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import type { BrandProfilUnos } from '@/lib/domain/brand-profile';
import { feningToKm } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';
import { ProfilForma } from './_components/ProfilForma';

export const metadata: Metadata = {
  title: bs.portal.profil.naslov,
};

export default async function PortalProfilPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  const { brand } = pristup;
  const suspendovan = brand.status === 'suspendovan';

  const pocetneVrijednosti: BrandProfilUnos = {
    naziv: brand.naziv,
    kratkiOpis: brand.kratkiOpis ?? '',
    prica: brand.prica ?? '',
    web: brand.web ?? '',
    email: brand.email ?? '',
    telefon: brand.telefon ?? '',
    jib: brand.jib ?? '',
    pdvBroj: brand.pdvBroj ?? '',
    adresa: brand.adresa ?? '',
    cijenaDostaveKm: feningToKm(brand.cijenaDostave).toFixed(2),
    pragBesplatneDostaveKm:
      brand.pragBesplatneDostave === null ? '' : feningToKm(brand.pragBesplatneDostave).toFixed(2),
    nemaBesplatneDostave: brand.pragBesplatneDostave === null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.profil.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/70">{bs.portal.profil.podnaslov}</p>
      </div>

      {suspendovan ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[#B3261E]/20 bg-[#B3261E]/10 p-4"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B3261E]" aria-hidden="true" />
          <p className="text-sm text-[#B3261E]">{bs.portal.profil.suspendovan}</p>
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-2xl border border-[#1C2B22]/10 bg-[#C7D6BA]/25 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#16332A]" aria-hidden="true" />
        <p className="text-sm text-[#1C2B22]/80">{bs.portal.profil.napomena}</p>
      </div>

      {/* Upload slika traži storage konfiguraciju — zasad samo pregled. */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[#1C2B22]/10 bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.portal.profil.slike.naslov}</h2>
          <p className="text-sm text-[#8A9086]">{bs.portal.profil.slike.napomena}</p>
        </div>

        {brand.logoUrl || brand.coverUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {brand.logoUrl ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-[#1C2B22]">
                  {bs.portal.profil.slike.logo}
                </span>
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-[#F2F5ED]">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.naziv}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}

            {brand.coverUrl ? (
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-sm font-medium text-[#1C2B22]">
                  {bs.portal.profil.slike.cover}
                </span>
                <div className="relative h-32 w-full overflow-hidden rounded-2xl border border-[#1C2B22]/10 bg-[#F2F5ED]">
                  <Image
                    src={brand.coverUrl}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 32rem, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[#1C2B22]/70">{bs.portal.profil.slike.nema}</p>
        )}
      </section>

      <ProfilForma
        brandId={brand.id}
        pocetneVrijednosti={pocetneVrijednosti}
        onemoguceno={suspendovan}
      />
    </div>
  );
}
