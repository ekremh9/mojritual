import Link from 'next/link';
import { MessageCircle, Package, ShoppingBag, TrendingUp, type LucideIcon } from 'lucide-react';
import { auth } from '@/auth';
import { getUserBrand } from '@/lib/domain/brand-access';
import { formatCijena } from '@/lib/domain/format';
import { bs } from '@/lib/i18n/bs';

type Statistika = {
  label: string;
  vrijednost: string;
  ikona: LucideIcon;
};

export default async function PortalPregledPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const pristup = await getUserBrand(session.user.id);

  if (!pristup) {
    // Layout već prikazuje poruku o nepovezanom nalogu.
    return null;
  }

  // Placeholderi — stvarni upiti dolaze uz stranice proizvoda, narudžbi
  // i reklamacija. Nula je ovdje prikaz, ne izračun.
  const statistike: Statistika[] = [
    { label: bs.portal.dashboard.aktivnihProizvoda, vrijednost: '0', ikona: Package },
    { label: bs.portal.dashboard.novihNarudzbi, vrijednost: '0', ikona: ShoppingBag },
    { label: bs.portal.dashboard.otvorenihReklamacija, vrijednost: '0', ikona: MessageCircle },
    { label: bs.portal.dashboard.prihodMjesec, vrijednost: formatCijena(0), ikona: TrendingUp },
  ];

  const brziLinkovi = [
    { href: '/portal/proizvodi/novi', label: bs.portal.dashboard.dodajProizvod, ikona: Package },
    { href: '/portal/profil', label: bs.portal.dashboard.urediProfil, ikona: TrendingUp },
    { href: '/portal/narudzbe', label: bs.portal.dashboard.pogledajNarudzbe, ikona: ShoppingBag },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[#1C2B22]">{bs.portal.dashboard.naslov}</h1>
        <p className="text-sm text-[#1C2B22]/70">
          {bs.portal.dashboard.podnaslov(pristup.brand.naziv)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statistike.map((statistika) => (
          <div
            key={statistika.label}
            className="flex flex-col gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C7D6BA]/40">
              <statistika.ikona className="h-4 w-4 text-[#16332A]" />
            </span>
            <span className="text-2xl font-semibold text-[#1C2B22]">{statistika.vrijednost}</span>
            <span className="text-sm text-[#8A9086]">{statistika.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-[#1C2B22]">{bs.portal.dashboard.brziLinkovi}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {brziLinkovi.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-2xl border border-[#1C2B22]/10 bg-white p-4 text-sm font-medium text-[#1C2B22] transition-colors hover:bg-[#C7D6BA]/25"
            >
              <link.ikona className="h-4 w-4 shrink-0 text-[#16332A]" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
